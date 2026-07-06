import { NextResponse } from "next/server";

import { getApiAuthenticatedProfile } from "@/lib/api-auth";
import { searchContacts } from "@/lib/contacts";

export async function GET(request: Request) {
  try {
    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const contacts = await searchContacts(query);

    return NextResponse.json({ contacts });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
