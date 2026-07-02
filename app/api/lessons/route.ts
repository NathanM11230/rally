import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentInstructorProfile } from "@/lib/instructor-profiles";
import { createLesson, getUpcomingLessons } from "@/lib/lessons";
import { parseLessonInput } from "@/lib/lesson-input";
import type { LessonInsert } from "@/types/database";

export async function GET() {
  try {
    const lessons = await getUpcomingLessons();
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
    const profile = await getCurrentInstructorProfile();

    if (!profile) {
      return NextResponse.json(
        { error: "Create an instructor profile before adding lessons." },
        { status: 409 },
      );
    }

    const lesson = await createLesson({
      ...(parsed.data as Omit<LessonInsert, "instructor_profile_id">),
      instructor_profile_id: profile.id,
      reminder_sent: false,
      reminder_sent_at: null,
    });

    revalidatePath("/");
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
