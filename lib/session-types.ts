import type { Lesson, SessionType } from "@/types/database";

export const SESSION_TYPES = [
  "lesson",
  "clinic",
  "other_event",
  "freshmen",
  "varsity",
  "team",
] as const;

export const sessionTypeLabels: Record<SessionType, string> = {
  lesson: "Lesson",
  clinic: "Clinic",
  other_event: "Other event",
  freshmen: "Freshmen",
  varsity: "Varsity",
  team: "Team",
};

export function isSessionType(value: unknown): value is SessionType {
  return typeof value === "string" && SESSION_TYPES.includes(value as SessionType);
}

export function getSessionType(lesson: Pick<Lesson, "session_type">) {
  return lesson.session_type ?? "lesson";
}

export function getSessionLabel(
  lesson: Pick<Lesson, "session_type" | "event_title">,
) {
  const sessionType = getSessionType(lesson);

  if (sessionType === "other_event") {
    return lesson.event_title?.trim() || "Other event";
  }

  return sessionTypeLabels[sessionType];
}

export function getStudentReminderSubject(
  lesson: Pick<Lesson, "session_type" | "event_title">,
) {
  const sessionType = getSessionType(lesson);

  if (sessionType === "clinic") {
    return "a tennis clinic";
  }

  if (sessionType === "freshmen") {
    return "Freshmen tennis";
  }

  if (sessionType === "varsity") {
    return "Varsity tennis";
  }

  if (sessionType === "team") {
    return "team tennis";
  }

  if (sessionType === "other_event") {
    return lesson.event_title?.trim() || "a tennis event";
  }

  return "a tennis lesson";
}
