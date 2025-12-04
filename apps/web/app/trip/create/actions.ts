"use server";

import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get API URL from environment variable and remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

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

async function startItineraryGeneration(tripId: string) {
  try {
    console.log(`[DEBUG] Starting itinerary generation for trip: ${tripId}`);
    console.log(`[DEBUG] API URL: ${API_URL}/itinerary/generate`);

    const response = await fetch(`${API_URL}/itinerary/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trip_id: tripId }),
    });

    console.log(`[DEBUG] Itinerary generate response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to start itinerary generation:", errorText);
      return null;
    }

    const result = await response.json();
    console.log(`[DEBUG] Itinerary generation started, job_id: ${result.job_id}`);
    return result.job_id;
  } catch (error) {
    console.error("Error starting itinerary generation:", error);
    return null;
  }
}

async function startTaskGeneration(tripId: string) {
  try {
    console.log(`[DEBUG] Starting task generation for trip: ${tripId}`);
    console.log(`[DEBUG] API URL: ${API_URL}/tasks/generate`);

    const response = await fetch(`${API_URL}/tasks/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trip_id: tripId }),
    });

    console.log(`[DEBUG] Task generate response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to start task generation:", errorText);
      return null;
    }

    const result = await response.json();
    console.log(`[DEBUG] Task generation started, job_id: ${result.job_id}`);
    return result.job_id;
  } catch (error) {
    console.error("Error starting task generation:", error);
    return null;
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

  console.log("[DEBUG] Step 1: Generating name and description...");
  const { name, description } = await generateTripNameAndDescription(tripData);
  console.log("[DEBUG] Step 1 complete:", { name, description });

  console.log("[DEBUG] Step 2: Saving trip to database...");
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

  const trip = data?.[0];
  console.log("[DEBUG] Step 2 complete. Trip ID:", trip?.id);

  // Automatically start itinerary and task generation in background
  console.log("[DEBUG] Step 3: Starting itinerary generation...");
  let itineraryJobId: string | null = null;
  let taskJobId: string | null = null;

  if (trip?.id) {
    // Start both generations in parallel
    const [itineraryResult, taskResult] = await Promise.all([
      startItineraryGeneration(trip.id),
      startTaskGeneration(trip.id)
    ]);

    itineraryJobId = itineraryResult;
    taskJobId = taskResult;

    if (itineraryJobId) {
      console.log(`[DEBUG] Step 3a complete. Itinerary Job ID: ${itineraryJobId}`);
    } else {
      console.log("[DEBUG] Step 3a: No itinerary job ID returned (generation may have failed)");
    }

    if (taskJobId) {
      console.log(`[DEBUG] Step 3b complete. Task Job ID: ${taskJobId}`);
    } else {
      console.log("[DEBUG] Step 3b: No task job ID returned (generation may have failed)");
    }
  }

  console.log("[DEBUG] Returning from createTrip:", {
    tripId: trip?.id,
    itineraryJobId,
    taskJobId
  });
  return { trip, jobId: itineraryJobId, taskJobId };
}
