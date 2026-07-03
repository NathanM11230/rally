import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { markLessonReminderSent } from "@/lib/lessons";

type ReminderSentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: ReminderSentRouteContext) {
  const { id } = await params;

  try {
    const lesson = await markLessonReminderSent(id, true);
    revalidatePath("/");
    revalidatePath(`/lessons/${id}/edit`);
    return NextResponse.json({ lesson });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: ReminderSentRouteContext) {
  const { id } = await params;

  try {
    const lesson = await markLessonReminderSent(id, false);
    revalidatePath("/");
    revalidatePath(`/lessons/${id}/edit`);
    return NextResponse.json({ lesson });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
