import { formatLessonDateTime } from "@/lib/date";
import type { LessonWithInstructorProfile } from "@/types/database";

type ManualSmsTarget = {
  href: string;
  message: string;
};

export function buildStudentReminderSms(
  lesson: LessonWithInstructorProfile,
  timeZone: string,
): ManualSmsTarget {
  const instructorName = lesson.instructor_profile?.full_name ?? "your instructor";
  const message = `Reminder: You have a tennis lesson with ${instructorName} on ${formatLessonDateTime(
    lesson,
    timeZone,
  )} at ${lesson.location}.`;

  return {
    href: buildSmsHref(lesson.student_phone, message),
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

  const message = `Reminder: You have a tennis lesson with ${
    lesson.student_name
  } on ${formatLessonDateTime(lesson, timeZone)} at ${lesson.location}.`;

  return {
    href: buildSmsHref(lesson.instructor_profile.phone_number, message),
    message,
  };
}

function buildSmsHref(phoneNumber: string, message: string) {
  return `sms:${cleanPhoneNumber(phoneNumber)}?body=${encodeURIComponent(message)}`;
}

function cleanPhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}
