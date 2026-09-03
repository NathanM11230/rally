import { NextResponse } from "next/server";

import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { enforceAuthRateLimit } from "@/lib/auth-rate-limit";
import { buildRallyInvitationMetadata } from "@/lib/account-access";
import { validateSignupAccess } from "@/lib/signup-access";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseSignupInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rateLimit = enforceAuthRateLimit(request, "signup");

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const signupAccess = validateSignupAccess({
    email: parsed.data.email,
    inviteCode: parsed.data.invite_code,
  });

  if (!signupAccess.ok) {
    return NextResponse.json({ error: signupAccess.error }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const redirectTo = new URL("/accept-invite", request.url).toString();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        redirectTo,
        data: {
          full_name: parsed.data.full_name,
          phone_number: parsed.data.phone_number,
        },
      },
    );

    if (error || !data.user) {
      return NextResponse.json(
        {
          error:
            "Unable to send an invitation. This email may already have a Rally account.",
        },
        { status: 400 },
      );
    }

    const { error: accessError } = await admin.auth.admin.updateUserById(
      data.user.id,
      {
        app_metadata: buildRallyInvitationMetadata(data.user.app_metadata),
      },
    );

    if (accessError) {
      await deleteIncompleteInvite(data.user.id);
      throw accessError;
    }

    return NextResponse.json(
      {
        ok: true,
        invitationSent: true,
      },
      { status: 202 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteIncompleteInvite(userId: string) {
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Unable to clean up an incomplete Rally invitation.", error);
    }
  } catch (error) {
    console.error("Unable to clean up an incomplete Rally invitation.", error);
  }
}

function parseSignupInput(body: unknown) {
  if (!isRecord(body)) {
    return { ok: false as const, error: "Request body must be a JSON object." };
  }

  const email = cleanString(body.email);
  const fullName = cleanString(body.full_name);
  const phoneNumber = cleanString(body.phone_number);
  const inviteCode = cleanString(body.invite_code);

  if (!email || !fullName || !phoneNumber) {
    return {
      ok: false as const,
      error: "Email, full name, and phone number are required.",
    };
  }

  return {
    ok: true as const,
    data: {
      email,
      full_name: fullName,
      phone_number: phoneNumber,
      invite_code: inviteCode,
    },
  };
}
