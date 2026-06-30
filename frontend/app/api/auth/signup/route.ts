import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username, role } = body;

    if (!email || !password || !username || !role) {
      return NextResponse.json(
        { error: 'Email, password, username and role are required' },
        { status: 400 }
      );
    }

    if (!['user', 'mechanic'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either user or mechanic' },
        { status: 400 }
      );
    }

    const redirectTo =
      process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;

    // 1. Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('SIGNUP ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Unable to create user account' },
        { status: 500 }
      );
    }

    // 2. Create profile in profiles table
    const profileResponse = await supabaseAdmin
      .from('profiles')
      .insert({
        auth_id: user.id,
        email: user.email,
        username,
        role,
      })
      .select()
      .single();

    if (profileResponse.error) {
      console.error('PROFILE ERROR:', profileResponse.error);
      return NextResponse.json({ error: profileResponse.error.message }, { status: 500 });
    }

    const profile = profileResponse.data;

    // 3. If role = mechanic → create mechanics extension row
    if (role === 'mechanic') {
      const mechanicResponse = await supabaseAdmin
        .from('mechanics')
        .insert({
          profile_id: profile.id,
          name: username,
          city: null,
          bio: null,
          profile_image_url: null,
          rating: 0,
          total_reviews: 0,
          is_verified: false,
        });

      if (mechanicResponse.error) {
        console.error('MECHANIC ERROR:', mechanicResponse.error);
        return NextResponse.json(
          { error: mechanicResponse.error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data: { user, profile } }, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
