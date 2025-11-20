"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "../../lib/auth";

export async function submitOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const citizenship = formData.get("citizenship") as string;
  const currency = formData.get("currency") as string;
  const food_dietary = formData.get("food_dietary") as string;

  // Initialize Supabase client with Service Role to bypass RLS if necessary
  // or ensuring we have permission to update
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("users")
    .update({
      name,
      citizenship,
      currency,
      food_dietary,
      onboarding_completed: true,
    })
    .eq("email", session.user.email);

  if (error) {
    console.error("Onboarding error:", error);
    throw new Error("Failed to update profile");
  }

  redirect("/");
}