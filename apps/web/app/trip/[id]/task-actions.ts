"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_completed: isCompleted })
      .eq("id", taskId)
      .select();

    if (error) {
      console.error("Error updating task:", error);
      throw new Error("Failed to update task");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error toggling task completion:", error);
    throw error;
  }
}
