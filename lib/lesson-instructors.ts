import type { InstructorProfile, LessonWithInstructorProfile } from "@/types/database";

export function getLessonInstructors(
  lesson: LessonWithInstructorProfile,
): InstructorProfile[] {
  const instructors = (lesson.lesson_instructors ?? [])
    .map((lessonInstructor) => lessonInstructor.instructor_profile)
    .filter((profile): profile is InstructorProfile => profile !== null);

  if (instructors.length > 0) {
    return instructors;
  }

  return lesson.instructor_profile ? [lesson.instructor_profile] : [];
}

export function getLessonInstructorNames(lesson: LessonWithInstructorProfile) {
  const names = getLessonInstructors(lesson).map((profile) => profile.full_name);

  return names.length > 0 ? names.join(", ") : "No pro assigned";
}

export function ensureInstructorIsAssigned(
  instructorProfileIds: string[],
  currentInstructorProfileId: string,
) {
  return Array.from(
    new Set([...instructorProfileIds, currentInstructorProfileId]),
  );
}

export function getPrimaryInstructorProfileId(
  instructorProfileIds: string[],
  previousPrimaryInstructorProfileId?: string,
) {
  if (
    previousPrimaryInstructorProfileId &&
    instructorProfileIds.includes(previousPrimaryInstructorProfileId)
  ) {
    return previousPrimaryInstructorProfileId;
  }

  return instructorProfileIds[0] ?? null;
}
