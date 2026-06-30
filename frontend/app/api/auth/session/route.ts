import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return NextResponse.json({ session: data.session ?? null });
}
