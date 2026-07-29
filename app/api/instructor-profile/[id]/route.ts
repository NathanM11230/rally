import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiAuthenticatedProfile } from "@/lib/api-auth";
import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { updateInstructorProfile } from "@/lib/instructor-profiles";

type InstructorProfileRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: InstructorProfileRouteContext) {
  const { id } = await params;
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseProfileInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    if (authResult.auth.profile.id !== id) {
      return NextResponse.json(
        { error: "You can only edit your own profile." },
        { status: 403 },
      );
    }

    const profile = await updateInstructorProfile(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/lessons/new");
    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

function parseProfileInput(body: unknown) {
  if (!isRecord(body)) {
    return { ok: false as const, error: "Request body must be a JSON object." };
  }

  const fullName = cleanString(body.full_name);
  const phoneNumber = cleanString(body.phone_number);

  if (!fullName || !phoneNumber) {
    return {
      ok: false as const,
      error: "Instructor full name and phone number are required.",
    };
  }

  return {
    ok: true as const,
    data: {
      full_name: fullName,
      phone_number: phoneNumber,
    },
  };
}
