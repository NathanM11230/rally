import { dateAndTimeToUtc, getLessonTimeZone } from "@/lib/date";
import type { LessonInsert, LessonUpdate } from "@/types/database";

type LessonInputMode = "create" | "update";

export type LessonStudentInput = {
  student_name: string;
  student_phone: string;
};

type ParsedLessonData = {
  lesson: LessonUpdate &
    Pick<
      LessonInsert,
      | "instructor_profile_id"
      | "student_name"
      | "student_phone"
      | "lesson_start_time"
      | "location"
    >;
  students: LessonStudentInput[];
};

type LessonInputResult =
  | { data: ParsedLessonData; errors: [] }
  | { data: null; errors: string[] };

const requiredFields = [
  "instructor_profile_id",
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
  const students = parseStudents(body.students);

  for (const field of requiredFields) {
    const value = cleanString(body[field]);

    if (!value) {
      errors.push(`${field} is required.`);
    } else {
      values[field] = value;
    }
  }

  if (students.length === 0) {
    errors.push("At least one student name and phone number is required.");
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
  const primaryStudent = students[0];
  const lesson: ParsedLessonData["lesson"] = {
    instructor_profile_id: values.instructor_profile_id,
    student_name: primaryStudent.student_name,
    student_phone: primaryStudent.student_phone,
    lesson_start_time: lessonStartTime.toISOString(),
    location: values.location,
    notes: cleanString(body.notes) || null,
  };

  if (mode === "create") {
    lesson.reminder_sent = false;
    lesson.reminder_sent_at = null;
  }

  return {
    data: {
      lesson,
      students,
    },
    errors: [],
  };
}

function parseStudents(value: unknown): LessonStudentInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((student) => {
      if (!isRecord(student)) {
        return null;
      }

      const studentName = cleanString(student.student_name);
      const studentPhone = cleanString(student.student_phone);

      if (!studentName || !studentPhone) {
        return null;
      }

      return {
        student_name: studentName,
        student_phone: studentPhone,
      };
    })
    .filter((student): student is LessonStudentInput => student !== null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
