import { dateAndTimeToUtc, getLessonTimeZone } from "@/lib/date";
import type { LessonInsert, LessonUpdate } from "@/types/database";

type LessonInputMode = "create" | "update";

type ParsedLessonData = Pick<
  LessonInsert,
  "student_name" | "student_phone" | "lesson_start_time" | "location" | "notes"
>;

type LessonInputResult =
  | { data: ParsedLessonData; errors: [] }
  | { data: null; errors: string[] };

const requiredFields = [
  "student_name",
  "student_phone",
  "lesson_date",
  "lesson_time",
  "location",
] as const;

export function parseLessonInput(body: unknown, mode: LessonInputMode): LessonInputResult {
  if (!isRecord(body)) {
    return { data: null, errors: ["Request body must be a JSON object."] };
  }

  const errors: string[] = [];
  const values: Record<string, string> = {};

  for (const field of requiredFields) {
    const value = cleanString(body[field]);

    if (!value) {
      errors.push(`${field} is required.`);
    } else {
      values[field] = value;
    }
  }

  if (values.lesson_date && !/^\d{4}-\d{2}-\d{2}$/.test(values.lesson_date)) {
    errors.push("lesson_date must use YYYY-MM-DD format.");
  }

  if (values.lesson_time && !/^\d{2}:\d{2}$/.test(values.lesson_time)) {
    errors.push("lesson_time must use HH:mm format.");
  }

  if (errors.length > 0) {
    return { data: null, errors };
  }

  const lessonStartTime = dateAndTimeToUtc(
    values.lesson_date,
    values.lesson_time,
    getLessonTimeZone(),
  );

  const data: LessonUpdate = {
    student_name: values.student_name,
    student_phone: values.student_phone,
    lesson_start_time: lessonStartTime.toISOString(),
    location: values.location,
    notes: cleanString(body.notes) || null,
  };

  if (mode === "create") {
    data.reminder_sent = false;
    data.reminder_sent_at = null;
  }

  return { data: data as ParsedLessonData, errors: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
