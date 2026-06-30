import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { request_id, text } = body ?? {};

    if (!request_id || typeof request_id !== 'string') {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
    }

    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    const backendResponse = await fetch(`${backendUrl}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ request_id, text }),
    });

    const responseText = await backendResponse.text();

    if (!backendResponse.ok) {
      let detail = responseText;
      try {
        const parsed = JSON.parse(responseText);
        detail = parsed.detail || parsed.message || parsed.error || JSON.stringify(parsed);
      } catch {
        // Keep the raw text response when parsing fails.
      }

      return NextResponse.json({ error: detail || backendResponse.statusText }, {
        status: backendResponse.status,
      });
    }

    try {
      return NextResponse.json(JSON.parse(responseText));
    } catch {
      return NextResponse.json({ message: responseText });
    }
  } catch (error) {
    console.error('Failed to proxy message creation', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
