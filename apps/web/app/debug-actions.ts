"use server";

import { createTrip } from "./trip/create/actions";
import { revalidatePath } from "next/cache";

export async function createTestTrip() {
  const dummyData = {
    destinations: ["Osaka, Japan"],
    startPoint: "Tokyo, Japan",
    endPoint: "Osaka, Japan",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day later
    flexibleDates: false,
    adultsCount: 2,
    childrenCount: 0,
    preferences: ["Culture", "Food", "Nature"],
    transportation: ["Train", "Walking"],
    budget: 5000,
    currency: "USD",
  };

  try {
    const result = await createTrip(dummyData);
    revalidatePath("/");

    // Return trip ID and job IDs (same as regular trip creation)
    return {
      success: true,
      tripId: result?.trip?.id,
      jobId: result?.jobId,
      taskJobId: result?.taskJobId
    };
  } catch (error) {
    console.error("Failed to create test trip:", error);
    return { success: false, error: "Failed to create test trip" };
  }
}
