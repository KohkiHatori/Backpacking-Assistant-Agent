import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    // Extract fields that can be updated
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.cost !== undefined) updateData.cost = body.cost;
    if (body.type !== undefined) updateData.type = body.type;

    const { data, error } = await supabase
      .from("itinerary_items")
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating itinerary item:", error);
      return NextResponse.json({ error: "Failed to update itinerary item" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in update itinerary item API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    const { error } = await supabase
      .from("itinerary_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Error deleting itinerary item:", error);
      return NextResponse.json({ error: "Failed to delete itinerary item" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete itinerary item API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
