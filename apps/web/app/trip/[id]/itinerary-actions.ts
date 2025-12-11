"use server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function checkItineraryJobStatus(jobId: string) {
  try {
    const response = await fetch(`${API_URL}/itinerary/status/${jobId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch job status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking job status:", error);
    throw error;
  }
}

export async function modifyItinerary(tripId: string, modification: string) {
  try {
    const response = await fetch(`${API_URL}/itinerary/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trip_id: tripId,
        modification,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to start itinerary modification");
    }

    return await response.json();
  } catch (error) {
    console.error("Error modifying itinerary:", error);
    throw error;
  }
}





