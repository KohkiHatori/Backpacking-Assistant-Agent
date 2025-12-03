"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Trip, ItineraryItem, Task } from "@/lib/schemas";

const AGENT_API_URL = process.env.AGENT_API_URL || "http://127.0.0.1:8000";

export async function getTrip(tripId: string): Promise<Trip | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // @ts-ignore
  const userId = session.user.id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching trip:", error);
    return null;
  }

  return data as Trip;
}

export async function getItineraryItems(tripId: string): Promise<ItineraryItem[]> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching itinerary items:", error);
    return [];
  }

  return data as ItineraryItem[];
}

export async function getTasks(tripId: string): Promise<Task[]> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("trip_id", tripId)
    .order("is_completed", { ascending: true }) // Incomplete first
    .order("due_date", { ascending: true, nullsFirst: false }); // Earliest due first

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data as Task[];
}

export async function updateTrip(tripId: string, updates: Partial<Trip>) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Exclude ID and user_id from updates to be safe
  const { id, user_id, created_at, updated_at, ...safeUpdates } = updates as any;

  const { data, error } = await supabase
    .from("trips")
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripId)
    .select()
    .single();

  if (error) {
    console.error("Error updating trip:", error);
    throw new Error("Failed to update trip");
  }

  return data as Trip;
}

export async function generateTripBlueprint(tripId: string, tripDetails: any) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // @ts-ignore
  const userId = session.user.id;
  const sessionId = `session_${tripId}`;

  // 1. Create/Ensure Session Exists
  const sessionUrl = `${AGENT_API_URL}/apps/travel_concierge/users/${userId}/sessions/${sessionId}`;
  try {
    // We try to create/get session. Ignore error if it already exists or returns 200/201.
    await fetch(sessionUrl, { method: "POST" });
  } catch (e) {
    console.warn("Session creation warning (might already exist):", e);
  }

  // 2. Construct Prompt
  const prompt = `
  SYSTEM INSTRUCTION:
  Act autonomously. Do NOT ask clarifying questions.
  If information is missing, use reasonable defaults or placeholders.
  Generate the itinerary, tasks, and SAVE them immediately using the available tools.

  I want to plan a trip.
  User Context: { "user_id": "${userId}" }
  Trip Details:
  - Origin: ${tripDetails.startPoint || "Not specified"}
  - Destination: ${tripDetails.destinations.join(", ")}
  - Dates: ${tripDetails.startDate} to ${tripDetails.endDate}
  - Travelers: ${tripDetails.adultsCount} adults, ${tripDetails.childrenCount} children
  - Budget: ${tripDetails.budget} ${tripDetails.currency}
  - Preferences: ${tripDetails.preferences.join(", ")}
  - Transportation: ${tripDetails.transportation.join(", ")}

  Please generate a full itinerary blueprint and save it.
  `;

  // 3. Call Run Endpoint (SSE)
  const runUrl = `${AGENT_API_URL}/run_sse`;
  const payload = {
    session_id: sessionId,
    app_name: "travel_concierge",
    user_id: userId,
    new_message: {
      role: "user",
      parts: [{ text: prompt }]
    }
  };

  try {
    const response = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream" // Important for SSE
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Agent API Error:", errorText);
      throw new Error(`Agent API failed: ${response.statusText}`);
    }

    // Since it's SSE, we just wait for it to finish.
    // In a real app, we'd stream this text to the client.
    // For now, we just consume the stream to ensure the agent completes its work.
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          console.log("Agent Chunk:", chunk); // Uncomment to debug agent thought process
        }
      }
    }

    return { success: true };

  } catch (error) {
    console.error("Failed to trigger blueprint generation:", error);
    return { success: false, error: "Failed to generate blueprint" };
  }
}
