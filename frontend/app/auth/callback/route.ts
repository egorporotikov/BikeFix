import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(req.url);

    if (error || !data?.session) {
      console.error("Auth callback (server) error:", error?.message || "no session");
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    return NextResponse.redirect(new URL("/auth/success", req.url));
  } catch (err) {
    console.error("Unexpected callback error:", err);
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}
