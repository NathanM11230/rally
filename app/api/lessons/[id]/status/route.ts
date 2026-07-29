import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  getApiAuthenticatedProfile,
  getAuthorizedLessonForProfile,
} from "@/lib/api-auth";
import { handleApiError, readJson } from "@/lib/api-helpers";
import { isLessonStatus } from "@/lib/lesson-status";
import { updateLessonStatus } from "@/lib/lessons";

type LessonStatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: LessonStatusRouteContext) {
  const { id } = await params;
  const body = await readJson(request);

  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const status = body.value.status;

  if (!isLessonStatus(status)) {
    return NextResponse.json({ error: "Invalid lesson status." }, { status: 400 });
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

    const lesson = await updateLessonStatus(id, status);

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/pay-periods");
    revalidatePath(`/lessons/${id}/edit`);

    return NextResponse.json({ lesson });
  } catch (error) {
    return handleApiError(error);
  }
}
