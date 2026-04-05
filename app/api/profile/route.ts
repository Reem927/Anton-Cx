import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * GET /api/profile — return the current user's profile, creating it if missing.
 * Works for both email sign-up and Google OAuth users.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Try to fetch existing profile
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    return NextResponse.json({ profile });
  }

  // Profile doesn't exist — create one (handles pre-trigger users + edge cases)
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: fullName,
      email: user.email ?? "",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: newProfile, created: true });
}

/**
 * PATCH /api/profile — update the current user's profile fields.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  // Only allow updating specific fields
  const allowed = ["full_name", "organization", "default_persona", "onboarding_completed"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
