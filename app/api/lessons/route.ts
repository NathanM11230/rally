import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiAuthenticatedProfile } from "@/lib/api-auth";
import { handleApiError, readJson } from "@/lib/api-helpers";
import { parseLessonInput } from "@/lib/lesson-input";
import {
  ensureInstructorIsAssigned,
  getPrimaryInstructorProfileId,
} from "@/lib/lesson-instructors";
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

    const instructorProfileIds = ensureInstructorIsAssigned(
      parsed.data.instructorProfileIds,
      authResult.auth.profile.id,
    );
    const primaryInstructorProfileId =
      getPrimaryInstructorProfileId(instructorProfileIds);

    if (!primaryInstructorProfileId) {
      return NextResponse.json({ error: "At least one pro is required." }, { status: 400 });
    }

    const lessonInput = {
      ...parsed.data.lesson,
      instructor_profile_id: primaryInstructorProfileId,
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
