import { NextResponse } from "next/server";

import {
  grantRallyAccess,
  hasRallyInvitation,
} from "@/lib/account-access";
import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { enforceAuthRateLimit } from "@/lib/auth-rate-limit";
import { getSupabaseAuthClient, setAuthCookies } from "@/lib/auth";
import { createOrUpdateInstructorProfileForUser } from "@/lib/instructor-profiles";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseInviteInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rateLimit = enforceAuthRateLimit(request, "accept-invite");

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many account setup attempts. Request a new invitation." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const authClient = getSupabaseAuthClient();
    const { data, error } = await authClient.auth.setSession({
      access_token: parsed.data.access_token,
      refresh_token: parsed.data.refresh_token,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: "This invitation is invalid or has expired." },
        { status: 401 },
      );
    }

    if (!hasRallyInvitation(data.user)) {
      return NextResponse.json(
        { error: "This invitation is not approved for Rally." },
        { status: 403 },
      );
    }

    const fullName = cleanString(data.user.user_metadata?.full_name);
    const phoneNumber = cleanString(data.user.user_metadata?.phone_number);

    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { error: "This invitation is missing the required pro profile details." },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      data.user.id,
      { password: parsed.data.password },
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Unable to save this password." },
        { status: 400 },
      );
    }

    await createOrUpdateInstructorProfileForUser(data.user.id, {
      full_name: fullName,
      phone_number: phoneNumber,
    });
    await grantRallyAccess(data.user);

    const response = NextResponse.json({ ok: true });
    setAuthCookies(response, data.session);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

function parseInviteInput(body: unknown) {
  if (!isRecord(body)) {
    return { ok: false as const, error: "Request body must be a JSON object." };
  }

  const accessToken = cleanString(body.access_token);
  const refreshToken = cleanString(body.refresh_token);
  const password = cleanString(body.password);

  if (!accessToken || !refreshToken || !password) {
    return {
      ok: false as const,
      error: "Invitation credentials and a password are required.",
    };
  }

  if (password.length < 10) {
    return { ok: false as const, error: "Password must be at least 10 characters." };
  }

  return {
    ok: true as const,
    data: {
      access_token: accessToken,
      refresh_token: refreshToken,
      password,
    },
  };
}
