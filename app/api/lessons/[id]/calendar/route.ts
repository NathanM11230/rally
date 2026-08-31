import { NextResponse } from "next/server";

import {
  getApiAuthenticatedProfile,
  getAuthorizedLessonForProfile,
} from "@/lib/api-auth";
import {
  buildLessonCalendarFile,
  buildLessonCalendarFilename,
} from "@/lib/calendar-event";
import { getValidLessonCalendarTokenPayload } from "@/lib/calendar-token";
import { getInstructorProfile } from "@/lib/instructor-profiles";
import { getLesson, isLessonAssignedToInstructor } from "@/lib/lessons";
import type { LessonWithInstructorProfile } from "@/types/database";
import { handleApiError } from "@/lib/api-helpers";

type CalendarRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: CalendarRouteContext) {
  const { id } = await params;

  try {
    const token = new URL(request.url).searchParams.get("token");
    const tokenPayload = getValidLessonCalendarTokenPayload(id, token);

    if (tokenPayload) {
      const lesson = await getLesson(id);
      const instructorProfile = await getInstructorProfile(
        tokenPayload.instructorProfileId,
      );

      if (
        !lesson ||
        !instructorProfile ||
        instructorProfile.is_active === false ||
        (instructorProfile.calendar_token_version ?? 0) !==
          tokenPayload.tokenVersion ||
        !isLessonAssignedToInstructor(lesson, tokenPayload.instructorProfileId)
      ) {
        return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
      }

      return buildCalendarResponse(lesson);
    }

    const authResult = await getApiAuthenticatedProfile();

    if (!authResult.ok) {
      return authResult.response;
    }

    const lessonResult = await getAuthorizedLessonForProfile(
      id,
      authResult.auth.profile.id,
    );

    if (!lessonResult.ok) {
      return lessonResult.response;
    }

    return buildCalendarResponse(lessonResult.lesson);
  } catch (error) {
    return handleApiError(error);
  }
}

function buildCalendarResponse(lesson: LessonWithInstructorProfile) {
  const calendarFile = buildLessonCalendarFile(lesson);
  const filename = buildLessonCalendarFilename(lesson);

  return new Response(calendarFile, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
