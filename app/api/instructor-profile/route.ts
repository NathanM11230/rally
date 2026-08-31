import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiAuthenticatedProfile } from "@/lib/api-auth";
import { cleanString, handleApiError, isRecord, readJson } from "@/lib/api-helpers";
import { hasRallyAccess } from "@/lib/account-access";
import { getCurrentUser } from "@/lib/auth";
import {
  createOrUpdateInstructorProfileForUser,
  getInstructorProfileByUserId,
  getInstructorProfiles,
} from "@/lib/instructor-profiles";

export async function GET() {
  try {
    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    const profiles = await getInstructorProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseProfileInput(body.value);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
    }

    const existingProfile = await getInstructorProfileByUserId(user.id);

    if (existingProfile?.is_active === false) {
      return NextResponse.json(
        { error: "This Rally profile has been disabled." },
        { status: 403 },
      );
    }

    if (!existingProfile && !hasRallyAccess(user)) {
      return NextResponse.json(
        { error: "This account has not been approved for Rally." },
        { status: 403 },
      );
    }

    const profile = await createOrUpdateInstructorProfileForUser(user.id, parsed.data);
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
