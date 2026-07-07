import { formatLessonDateTime } from "@/lib/date";
import { getLessonInstructors } from "@/lib/lesson-instructors";
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
  const firstName = getFirstName(student.student_name);
  const lessonDateTime = formatLessonDateTime(lesson, timeZone);
  const locationPhrase = buildLocationPhrase(lesson.location);
  const message = buildStudentReminderMessage({
    firstName,
    lesson,
    lessonDateTime,
    locationPhrase,
  });

  return {
    href: buildSmsHref(student.student_phone, message),
    label: `Text ${student.student_name}`,
    message,
  };
}

export function buildInstructorReminderSmsTargets(
  lesson: LessonWithInstructorProfile,
  timeZone: string,
): ManualSmsTarget[] {
  const studentNames = getLessonStudents(lesson)
    .map((student) => student.student_name)
    .join(", ");
  const subject = getStudentReminderSubject(lesson);
  const instructors = getLessonInstructors(lesson);

  return instructors.map((instructor) => {
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
      href: buildSmsHref(instructor.phone_number, message),
      label: `Text ${instructor.full_name}`,
      message,
    };
  });
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

function buildStudentReminderMessage({
  firstName,
  lesson,
  lessonDateTime,
  locationPhrase,
}: {
  firstName: string;
  lesson: LessonWithInstructorProfile;
  lessonDateTime: string;
  locationPhrase: string;
}) {
  if (lesson.session_type === "lesson") {
    return `Hey ${firstName}. Reminder about your lesson ${locationPhrase} at ${lessonDateTime}. Let me know if there is anything specific you would like to work on. Thanks!`;
  }

  return `Hey ${firstName}. Reminder about ${getStudentReminderSubject(
    lesson,
  )} ${locationPhrase} at ${lessonDateTime}.`;
}

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

function buildLocationPhrase(location: string) {
  const locations = location
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (locations.length === 0) {
    return "at the club";
  }

  const looksLikeCourt = locations.some(
    (item) => /^courts?\b/i.test(item) || /\d/.test(item),
  );

  if (!looksLikeCourt) {
    return `at ${locations.join(", ")}`;
  }

  const courts = locations.map((item) => {
    const cleaned = item.replace(/^courts?\s*/i, "").trim();

    return cleaned || item;
  });
  const label = courts.length === 1 ? "court" : "courts";

  return `on ${label} ${courts.join(", ")}`;
}
