import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiAuthenticatedProfile } from "@/lib/api-auth";
import { parseLessonInput } from "@/lib/lesson-input";
import { createLesson, getUpcomingLessonsForInstructor } from "@/lib/lessons";
import type { LessonInsert } from "@/types/database";

export async function GET() {
  try {
    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    const lessons = await getUpcomingLessonsForInstructor(authResult.auth.profile.id);
    return NextResponse.json({ lessons });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseLessonInput(body.value, "create");

  if (parsed.errors.length > 0) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  if (!parsed.data) {
    return NextResponse.json({ error: "Lesson input is invalid." }, { status: 400 });
  }

  try {
    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    const instructorProfileIds = ensureProfileIsAssigned(
      parsed.data.instructorProfileIds,
      authResult.auth.profile.id,
    );
    const lessonInput = {
      ...parsed.data.lesson,
      instructor_profile_id: instructorProfileIds[0],
    } as LessonInsert;
    const lesson = await createLesson(
      lessonInput,
      parsed.data.students,
      instructorProfileIds,
    );

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/pay-periods");
    revalidatePath("/lessons/new");
    return NextResponse.json({ lesson }, { status: 201 });
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

function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

function ensureProfileIsAssigned(instructorProfileIds: string[], profileId: string) {
  return Array.from(new Set([profileId, ...instructorProfileIds]));
}
