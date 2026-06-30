import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Notification webhook payload:", payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to parse webhook payload", error);
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}
