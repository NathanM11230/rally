import { NextResponse } from "next/server";

import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { getSupabaseAuthClient, setAuthCookies } from "@/lib/auth";
import { createOrUpdateInstructorProfileForUser } from "@/lib/instructor-profiles";
import { validateSignupAccess } from "@/lib/signup-access";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseSignupInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const signupAccess = validateSignupAccess({
    email: parsed.data.email,
    inviteCode: parsed.data.invite_code,
  });

  if (!signupAccess.ok) {
    return NextResponse.json({ error: signupAccess.error }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to create account." },
        { status: 400 },
      );
    }

    await createOrUpdateInstructorProfileForUser(data.user.id, {
      full_name: parsed.data.full_name,
      phone_number: parsed.data.phone_number,
    });

    const response = NextResponse.json({
      ok: true,
      needsEmailConfirmation: !data.session,
    });

    if (data.session) {
      setAuthCookies(response, data.session);
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

function parseSignupInput(body: unknown) {
  if (!isRecord(body)) {
    return { ok: false as const, error: "Request body must be a JSON object." };
  }

  const email = cleanString(body.email);
  const password = cleanString(body.password);
  const fullName = cleanString(body.full_name);
  const phoneNumber = cleanString(body.phone_number);
  const inviteCode = cleanString(body.invite_code);

  if (!email || !password || !fullName || !phoneNumber) {
    return {
      ok: false as const,
      error: "Email, password, full name, and phone number are required.",
    };
  }

  if (password.length < 10) {
    return { ok: false as const, error: "Password must be at least 10 characters." };
  }

  return {
    ok: true as const,
    data: {
      email,
      password,
      full_name: fullName,
      phone_number: phoneNumber,
      invite_code: inviteCode,
    },
  };
}
