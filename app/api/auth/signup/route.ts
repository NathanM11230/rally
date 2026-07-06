import { NextResponse } from "next/server";

import { getSupabaseAuthClient, setAuthCookies } from "@/lib/auth";
import { createOrClaimInstructorProfileForUser } from "@/lib/instructor-profiles";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseSignupInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
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

    await createOrClaimInstructorProfileForUser(data.user.id, {
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

async function readJson(request: Request) {
  try {
    return { ok: true as const, value: await request.json() };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
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

  if (!email || !password || !fullName || !phoneNumber) {
    return {
      ok: false as const,
      error: "Email, password, full name, and phone number are required.",
    };
  }

  if (password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters." };
  }

  return {
    ok: true as const,
    data: {
      email,
      password,
      full_name: fullName,
      phone_number: phoneNumber,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
