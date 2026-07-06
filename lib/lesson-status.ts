import type { Lesson, LessonStatus } from "@/types/database";

export const LESSON_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const lessonStatusLabels: Record<LessonStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function isLessonStatus(value: unknown): value is LessonStatus {
  return typeof value === "string" && LESSON_STATUSES.includes(value as LessonStatus);
}

export function getLessonStatus(lesson: Pick<Lesson, "status">) {
  return lesson.status ?? "scheduled";
}

export function getLessonStatusClass(status: LessonStatus) {
  return `status-${status.replace("_", "-")}`;
}
