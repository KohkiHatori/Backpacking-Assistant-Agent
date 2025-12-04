"use server";

import { createTrip } from "./trip/create/actions";
import { generateTripBlueprint } from "./trip/[id]/actions";
import { revalidatePath } from "next/cache";

export async function createTestTrip() {
  const dummyData = {
    destinations: ["Osaka"],
    startPoint: "Tokyo",
    endPoint: "Osaka",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day later
    flexibleDates: false,
    adultsCount: 2,
    childrenCount: 0,
    preferences: ["Culture", "Food", "Nature"],
    transportation: ["Train", "Walking"],
    budget: 5000,
    currency: "USD",
  };

  try {
    const trip = await createTrip(dummyData);
    revalidatePath("/");
    return { success: true, tripId: trip?.id };
  } catch (error) {
    console.error("Failed to create test trip:", error);
    return { success: false, error: "Failed to create test trip" };
  }
}
