import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  getApiAuthenticatedProfile,
  getAuthorizedLessonForProfile,
} from "@/lib/api-auth";
import { parseLessonInput } from "@/lib/lesson-input";
import { deleteLesson, updateLesson } from "@/lib/lessons";

type LessonRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: LessonRouteContext) {
  const { id } = await params;

  try {
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

    return NextResponse.json({ lesson: lessonResult.lesson });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: LessonRouteContext) {
  const { id } = await params;
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = parseLessonInput(body.value, "update");

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

    const lessonResult = await getAuthorizedLessonForProfile(
      id,
      authResult.auth.profile.id,
    );

    if (!lessonResult.ok) {
      return lessonResult.response;
    }

    const instructorProfileIds = ensureProfileIsAssigned(
      parsed.data.instructorProfileIds,
      authResult.auth.profile.id,
    );
    const lesson = await updateLesson(
      id,
      {
        ...parsed.data.lesson,
        instructor_profile_id: instructorProfileIds[0],
      },
      parsed.data.students,
      instructorProfileIds,
    );
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/pay-periods");
    revalidatePath(`/lessons/${id}/edit`);
    return NextResponse.json({ lesson });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: LessonRouteContext) {
  const { id } = await params;

  try {
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

    await deleteLesson(id);
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/pay-periods");
    return NextResponse.json({ ok: true });
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
