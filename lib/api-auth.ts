import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { getLesson, isLessonAssignedToInstructor } from "@/lib/lessons";
import type { AuthenticatedProfile } from "@/lib/auth";
import type { LessonWithInstructorProfile } from "@/types/database";

type ApiAuthResult =
  | {
      ok: true;
      auth: AuthenticatedProfile;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type LessonAccessResult =
  | {
      ok: true;
      lesson: LessonWithInstructorProfile;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function getApiAuthenticatedProfile(): Promise<ApiAuthResult> {
  const current = await getCurrentProfile();

  if (!current) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Log in to continue." }, { status: 401 }),
    };
  }

  if (!current.profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Complete your pro profile before continuing." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    auth: {
      user: current.user,
      profile: current.profile,
    },
  };
}

export async function getAuthorizedLessonForProfile(
  lessonId: string,
  instructorProfileId: string,
): Promise<LessonAccessResult> {
  const lesson = await getLesson(lessonId);

  if (!lesson || !isLessonAssignedToInstructor(lesson, instructorProfileId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Lesson not found." }, { status: 404 }),
    };
  }

  return { ok: true, lesson };
}
