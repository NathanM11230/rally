import { NextResponse } from "next/server";

import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { grantRallyAccess, hasRallyAccess } from "@/lib/account-access";
import { enforceAuthRateLimit } from "@/lib/auth-rate-limit";
import { getSupabaseAuthClient, setAuthCookies } from "@/lib/auth";
import { getInstructorProfileByUserId } from "@/lib/instructor-profiles";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseLoginInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rateLimit = enforceAuthRateLimit(request, "login");

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to log in." },
        { status: 401 },
      );
    }

    const existingProfile = await getInstructorProfileByUserId(data.user.id);

    if (existingProfile?.is_active === false) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This Rally profile has been disabled." },
        { status: 403 },
      );
    }

    if (!hasRallyAccess(data.user) && !existingProfile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account has not been approved for Rally." },
        { status: 403 },
      );
    }

    // Profiles created before the access claim was introduced remain valid.
    if (existingProfile && !hasRallyAccess(data.user)) {
      await grantRallyAccess(data.user);
    }

    const response = NextResponse.json({ ok: true });
    setAuthCookies(response, data.session);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

function parseLoginInput(body: unknown) {
  if (!isRecord(body)) {
    return { ok: false as const, error: "Request body must be a JSON object." };
  }

  const email = cleanString(body.email);
  const password = cleanString(body.password);

  if (!email || !password) {
    return { ok: false as const, error: "Email and password are required." };
  }

  return { ok: true as const, data: { email, password } };
}
