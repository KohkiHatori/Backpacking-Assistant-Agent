"use server";

import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateTripNameAndDescription(tripData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Based on the following trip details, generate a catchy name and a short, engaging description.

  Destinations: ${tripData.destinations.join(", ") || "Not specified"}
  Start Point: ${tripData.startPoint || "Not specified"}
  End Point: ${tripData.endPoint || "Not specified"}
  Dates: ${
    tripData.flexibleDates
      ? "Flexible"
      : `${tripData.startDate} to ${tripData.endDate}`
  }
  Preferences: ${tripData.preferences.join(", ") || "None"}
  Transportation: ${tripData.transportation.join(", ") || "Not specified"}
  Budget: ${tripData.budget} ${tripData.currency}

  Return the result as a JSON object with "name" and "description" properties.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    // Clean the text to be valid JSON
    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating trip name and description:", error);
    return {
      name: `Trip to ${tripData.destinations[0] || tripData.endPoint || "Unknown"}`,
      description: "An amazing adventure awaits!",
    };
  }
}

export async function createTrip(tripData: any) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { name, description } = await generateTripNameAndDescription(tripData);

  const { data, error } = await supabase.from("trips").insert([
    {
      user_id: session.user.id,
      name,
      description,
      destinations: tripData.destinations,
      start_point: tripData.startPoint,
      end_point: tripData.endPoint,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      flexible_dates: tripData.flexibleDates,
      preferences: tripData.preferences,
      transportation: tripData.transportation,
      budget: tripData.budget,
      currency: tripData.currency,
    },
  ]);

  if (error) {
    console.error("Error creating trip:", error);
    throw new Error("Failed to create trip");
  }

  return data;
}
