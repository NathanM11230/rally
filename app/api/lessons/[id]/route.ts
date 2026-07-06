import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { deleteLesson, getLesson, updateLesson } from "@/lib/lessons";
import { parseLessonInput } from "@/lib/lesson-input";

type LessonRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: LessonRouteContext) {
  const { id } = await params;

  try {
    const lesson = await getLesson(id);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json({ lesson });
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
    const lesson = await updateLesson(
      id,
      parsed.data.lesson,
      parsed.data.students,
      parsed.data.instructorProfileIds,
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
