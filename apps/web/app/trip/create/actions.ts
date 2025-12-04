"use server";

import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function generateTripNameAndDescription(tripData: any) {
  try {
    // Call the backend API agent service
    const response = await fetch(`${API_URL}/agents/generate-trip-name`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destinations: tripData.destinations,
        start_point: tripData.startPoint,
        end_point: tripData.endPoint,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        flexible_dates: tripData.flexibleDates,
        adults_count: tripData.adultsCount,
        children_count: tripData.childrenCount,
        preferences: tripData.preferences,
        transportation: tripData.transportation,
        budget: tripData.budget,
        currency: tripData.currency,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error:", errorData);
      throw new Error(errorData.detail || "Failed to generate trip name and description");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error generating trip name and description:", error);
    // Fallback to simple name generation
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

  // @ts-ignore - session.user.id is added in auth callbacks
  const userId = session.user.id as string;

  if (!userId) {
    throw new Error("User ID not found in session");
  }

  const { name, description } = await generateTripNameAndDescription(tripData);

  const { data, error } = await supabase.from("trips").insert([
    {
      user_id: userId,
      name,
      description,
      destinations: tripData.destinations,
      start_point: tripData.startPoint,
      end_point: tripData.endPoint,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      flexible_dates: tripData.flexibleDates,
      adults_count: tripData.adultsCount,
      children_count: tripData.childrenCount,
      preferences: tripData.preferences,
      transportation: tripData.transportation,
      budget: tripData.budget,
      currency: tripData.currency,
    },
  ]).select();

  if (error) {
    console.error("Error creating trip:", error);
    throw new Error("Failed to create trip");
  }

  return data?.[0];
}
