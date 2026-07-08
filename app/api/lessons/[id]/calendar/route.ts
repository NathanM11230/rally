import { NextResponse } from "next/server";

import {
  getApiAuthenticatedProfile,
  getAuthorizedLessonForProfile,
} from "@/lib/api-auth";
import {
  buildLessonCalendarFile,
  buildLessonCalendarFilename,
} from "@/lib/calendar-event";
import { isValidLessonCalendarToken } from "@/lib/calendar-token";
import { getLesson } from "@/lib/lessons";
import type { LessonWithInstructorProfile } from "@/types/database";

type CalendarRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: CalendarRouteContext) {
  const { id } = await params;

  try {
    const token = new URL(request.url).searchParams.get("token");

    if (isValidLessonCalendarToken(id, token)) {
      const lesson = await getLesson(id);

      if (!lesson) {
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
    },
  });
}

function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
