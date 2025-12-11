import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    const { data, error } = await supabase
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("day_number", { ascending: true })
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching itinerary:", error);
      return NextResponse.json({ error: "Failed to fetch itinerary" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in itinerary API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}





