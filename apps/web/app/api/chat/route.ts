import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

const AGENT_API_URL = process.env.AGENT_API_URL || "http://127.0.0.1:8000";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, tripId } = await req.json();

  console.log("POST /api/chat - tripId:", tripId);
  console.log("Received messages:", JSON.stringify(messages, null, 2));

  const modifySchema = z.object({
    modification: z.string().describe("The description of the modification requested by the user"),
  });


  // Convert messages to core format, supporting v5 structure with parts/text/content
  const coreMessages = (Array.isArray(messages) ? messages : [])
    .map((m: any) => {
      let content = "";

      if (m.parts && Array.isArray(m.parts)) {
        content = m.parts.map((p: any) => p.text || p.content || "").join("");
      } else if (typeof m.content === "string") {
        content = m.content;
      } else if (typeof m.text === "string") {
        content = m.text;
      } else if (typeof m === "string") {
        content = m;
      }

      return {
        role: m.role || "user",
        content: content || "",
        ...(m.id ? { id: m.id } : {}),
      };
    })
    .filter((m) => m.content.trim().length > 0);

  console.log("Core messages after processing:", JSON.stringify(coreMessages, null, 2));

  if (coreMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid messages provided for AI generation" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Fetch trip details from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let tripContext = "";
  try {
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (trip) {
      // Fetch itinerary items
      const { data: itineraryItems } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_number", { ascending: true })
        .order("start_time", { ascending: true });

      let itineraryText = "No itinerary items created yet.";
      if (itineraryItems && itineraryItems.length > 0) {
        itineraryText = itineraryItems.map((item: any) => {
          const timeStr = item.start_time ? `[${item.start_time.slice(0, 5)}] ` : "";
          return `Day ${item.day_number}: ${timeStr}${item.title} (${item.type || 'activity'}) - ${item.location || ''}`;
        }).join("\n");
      }

      console.log("Trip:", trip);

      const destinations = Array.isArray(trip.destinations)
        ? trip.destinations.join(", ")
        : (trip.destinations || trip.destination || "Not specified"); // Fallback to singular if schema mismatch

      const preferences = Array.isArray(trip.preferences)
        ? trip.preferences.join(", ")
        : (trip.preferences || trip.interests || "None"); // Fallback to interests if schema mismatch

      const travelers = `${trip.adults_count || 1} adults, ${trip.children_count || 0} children`;

      tripContext = `
TRIP CONTEXT:
- Destinations: ${destinations}
- Dates: ${trip.start_date} to ${trip.end_date}
- Budget: ${trip.budget} ${trip.currency}
- Travelers: ${travelers}
- Preferences: ${preferences}
- Description: ${trip.description || "None"}

CURRENT ITINERARY:
${itineraryText}
      `.trim();
    } else {
      console.error("Trip not found");
    }
    console.log("Trip context:", tripContext);
  } catch (error) {
    console.error("Error fetching trip details:", error);
  }

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    system: `You are a helpful travel assistant for a specific trip (ID: ${tripId}).
${tripContext}

You have access to tools to modify the itinerary and find accommodations.
You have access to tools to modify the itinerary and find accommodations.

- When asked to modify the itinerary, use the 'modifyItinerary' tool.
- When asked for accommodation recommendations, use the 'getAccommodations' tool.
- Always be polite and helpful.
- If a tool returns a Job ID or status, inform the user that the process has started.
- Ask clarifying questions if the user's request is ambiguous.`,
    messages: coreMessages,
    // tools: {
    // modifyItinerary: tool({
    //   description: "Modify the current trip itinerary based on user request",
    //   parameters: modifySchema,
    //   execute: async ({ modification }: z.infer<typeof modifySchema>) => {
    //     console.log("Executing modifyItinerary:", { tripId, modification });
    //     try {
    //       const response = await fetch(`${AGENT_API_URL}/itinerary/modify`, {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({ trip_id: tripId, modification }),
    //       });

    //       if (!response.ok) {
    //         const errorText = await response.text();
    //         console.error("Itinerary modification failed:", errorText);
    //         return { success: false, error: "Failed to connect to itinerary agent" };
    //       }

    //       const data = await response.json();
    //       return { success: true, message: "Itinerary modification started", jobId: data.job_id };
    //     } catch (error) {
    //       console.error("Itinerary modification error:", error);
    //       return { success: false, error: "Failed to connect to itinerary agent" };
    //     }
    //   },
    // }),
    // getAccommodations: tool({
    //   description: "Get accommodation recommendations for a specific destination in the trip",
    //   parameters: z.object({
    //     destination: z.string().describe("The city or location to search for"),
    //     nights_count: z.number().default(3).describe("Number of nights to stay"),
    //     range_type: z.enum(["budget", "mid-range", "luxury", "all"]).default("all").describe("Price range preference"),
    //   }),
    //   execute: async ({ destination, nights_count, range_type }: { destination: string; nights_count: number; range_type: string }) => {
    //     console.log("Executing getAccommodations:", { tripId, destination, nights_count, range_type });
    //     try {
    //       const response = await fetch(`${AGENT_API_URL}/accommodations/recommend`, {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //           trip_id: tripId,
    //           destination,
    //           nights_count,
    //           range_type,
    //         }),
    //       });

    //       if (!response.ok) {
    //         const errorText = await response.text();
    //         console.error("Accommodation search failed:", errorText);
    //         return { success: false, error: "Failed to fetch accommodation recommendations" };
    //       }

    //       const data = await response.json();
    //       return {
    //         success: true,
    //         recommendations: data.recommendations,
    //         message: `Found ${data.recommendations?.length || 0} recommendations`,
    //       };
    //     } catch (error) {
    //       console.error("Accommodation search error:", error);
    //       return { success: false, error: "Failed to fetch accommodation recommendations" };
    //     }
    //   },
    // }),
    // },
  });

  return result.toUIMessageStreamResponse();
}
