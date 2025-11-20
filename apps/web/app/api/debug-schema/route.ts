import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try to insert a dummy row to see the error (which lists columns) OR just describe the table if possible.
  // But easiest is to just select 1 row and see the keys.
  const { data, error } = await supabase.from("accounts").select("*").limit(1);

  if (error) {
    return NextResponse.json({ error });
  }

  // If no data, we can't see keys.
  // We can try to inspect the internal structure or just guess.
  // Let's try to get table info via RPC if available, or just return what we have.

  return NextResponse.json({
    data,
    message: "If data is empty, check Supabase dashboard for column names."
  });
}
