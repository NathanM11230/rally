import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { getApiAuthenticatedProfile } from "@/lib/api-auth";
import { searchContacts, upsertContact } from "@/lib/contacts";

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

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  try {
    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    const parsed = parseContactInput(body.value);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const contact = await upsertContact(parsed.data);

    revalidatePath("/contacts");
    revalidatePath("/contacts/new");
    revalidatePath("/lessons/new");

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

function parseContactInput(value: unknown) {
  if (!isRecord(value)) {
    return { ok: false as const, error: "Contact input must be an object." };
  }

  const fullName = cleanString(value.full_name);
  const phoneNumber = cleanString(value.phone_number);

  if (!fullName) {
    return { ok: false as const, error: "Contact name is required." };
  }

  if (!phoneNumber) {
    return { ok: false as const, error: "Contact phone number is required." };
  }

  return {
    ok: true as const,
    data: {
      full_name: fullName,
      phone_number: phoneNumber,
    },
  };
}
