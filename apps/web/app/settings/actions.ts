"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserProfile(email: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error("Failed to fetch user profile");
  }

  return data;
}

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const citizenship = formData.get("citizenship") as string;
  const currency = formData.get("currency") as string;
  const food_dietary = formData.get("food_dietary") as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updateData = {
    name,
    citizenship,
    currency,
    food_dietary,
  };

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("email", session.user.email);

  if (error) {
    console.error("Settings update error:", error);
    throw new Error("Failed to update profile");
  }

  // Revalidate the settings page and home page to reflect changes
  revalidatePath("/settings");
  revalidatePath("/");

  redirect("/settings");
}
