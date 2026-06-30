import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    console.error("Failed to query unread notifications", error);
    return NextResponse.json({ unread: 0, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ unread: data?.length ?? 0 });
}
