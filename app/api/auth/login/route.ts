import { NextResponse } from "next/server";

import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { getSupabaseAuthClient, setAuthCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseLoginInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
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
