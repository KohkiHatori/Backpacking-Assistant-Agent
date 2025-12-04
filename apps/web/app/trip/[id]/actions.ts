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

  // TODO: Implement full itinerary generation using the new backend agent system
  // For now, we'll just skip this step since the old agent endpoints are deprecated
  // Future implementation will call something like:
  // POST /agents/generate-itinerary
  // POST /agents/generate-tasks

  console.log("generateTripBlueprint called for trip:", tripId);
  console.log("Full itinerary generation not yet implemented in new backend");

  // Return early - trip was already created with name/description
  // The old agent endpoints (/apps/travel_concierge/..., /run_sse) are deprecated
  // Future implementation will use new backend agents:
  // - POST /agents/generate-itinerary
  // - POST /agents/generate-tasks

  return {
    success: true,
    message: "Trip created with AI-generated name and description. Full itinerary generation coming soon."
  };
}
