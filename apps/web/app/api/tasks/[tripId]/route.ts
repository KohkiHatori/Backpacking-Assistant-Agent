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
      .from("tasks")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true }); // Keep original order

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in tasks API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
