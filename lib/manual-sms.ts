import { formatLessonDateTime } from "@/lib/date";
import { getStudentReminderSubject } from "@/lib/session-types";
import type { LessonStudent, LessonWithInstructorProfile } from "@/types/database";

type ManualSmsTarget = {
  href: string;
  label: string;
  message: string;
};

export function buildStudentReminderSms(
  lesson: LessonWithInstructorProfile,
  student: Pick<LessonStudent, "student_name" | "student_phone">,
  timeZone: string,
): ManualSmsTarget {
  const instructorName = lesson.instructor_profile?.full_name ?? "your instructor";
  const subject = getStudentReminderSubject(lesson);
  const message = `Reminder: You have ${subject} with ${instructorName} on ${formatLessonDateTime(
    lesson,
    timeZone,
  )} at ${lesson.location}.`;

  return {
    href: buildSmsHref(student.student_phone, message),
    label: `Text ${student.student_name}`,
    message,
  };
}

export function buildInstructorReminderSms(
  lesson: LessonWithInstructorProfile,
  timeZone: string,
): ManualSmsTarget | null {
  if (!lesson.instructor_profile) {
    return null;
  }

  const studentNames = getLessonStudents(lesson)
    .map((student) => student.student_name)
    .join(", ");
  const subject = getStudentReminderSubject(lesson);
  const message = studentNames
    ? `Reminder: You have ${subject} with ${studentNames} on ${formatLessonDateTime(
        lesson,
        timeZone,
      )} at ${lesson.location}.`
    : `Reminder: You have ${subject} on ${formatLessonDateTime(
        lesson,
        timeZone,
      )} at ${lesson.location}.`;

  return {
    href: buildSmsHref(lesson.instructor_profile.phone_number, message),
    label: `Text ${lesson.instructor_profile.full_name}`,
    message,
  };
}

export function getLessonStudents(lesson: LessonWithInstructorProfile) {
  if (lesson.lesson_students.length > 0) {
    return lesson.lesson_students;
  }

  if (!lesson.student_name || !lesson.student_phone) {
    return [];
  }

  return [
    {
      id: lesson.id,
      lesson_id: lesson.id,
      student_name: lesson.student_name,
      student_phone: lesson.student_phone,
      sort_order: 0,
      created_at: lesson.created_at,
    },
  ];
}

function buildSmsHref(phoneNumber: string, message: string) {
  return `sms:${cleanPhoneNumber(phoneNumber)}?body=${encodeURIComponent(message)}`;
}

function cleanPhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}
