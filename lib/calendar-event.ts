import { getLessonInstructorNames } from "@/lib/lesson-instructors";
import { getLessonStudents } from "@/lib/manual-sms";
import { getSessionLabel } from "@/lib/session-types";
import type { LessonWithInstructorProfile } from "@/types/database";

const DEFAULT_EVENT_DURATION_MINUTES = 60;

export function buildLessonCalendarFile(lesson: LessonWithInstructorProfile) {
  const startDate = new Date(lesson.lesson_start_time);
  const endDate = new Date(
    startDate.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000,
  );
  const sessionLabel = getSessionLabel(lesson);
  const students = getLessonStudents(lesson);
  const participantNames = students.map((student) => student.student_name).join(", ");
  const summary = participantNames
    ? `${sessionLabel}: ${participantNames}`
    : sessionLabel;
  const descriptionLines = [
    participantNames ? `Participants: ${participantNames}` : null,
    `Pros: ${getLessonInstructorNames(lesson)}`,
    lesson.location ? `Location: ${lesson.location}` : null,
    lesson.notes ? `Notes: ${lesson.notes}` : null,
  ].filter((line): line is string => Boolean(line));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rally//Lesson Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:rally-lesson-${lesson.id}@rally`,
    `DTSTAMP:${formatIcsUtcDate(new Date())}`,
    `DTSTART:${formatIcsUtcDate(startDate)}`,
    `DTEND:${formatIcsUtcDate(endDate)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(lesson.location)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join("\n"))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function buildLessonCalendarFilename(lesson: LessonWithInstructorProfile) {
  const sessionLabel = getSessionLabel(lesson);
  const students = getLessonStudents(lesson);
  const namePart =
    students.length > 0
      ? students.map((student) => student.student_name).join(" ")
      : sessionLabel;
  const datePart = lesson.lesson_start_time.slice(0, 10);
  const fileName = `${datePart}-${namePart}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${fileName || "rally-lesson"}.ics`;
}

function formatIcsUtcDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string) {
  const maxLength = 75;
  const foldedLines: string[] = [];
  let remainingLine = line;

  while (remainingLine.length > maxLength) {
    foldedLines.push(remainingLine.slice(0, maxLength));
    remainingLine = ` ${remainingLine.slice(maxLength)}`;
  }

  foldedLines.push(remainingLine);

  return foldedLines.join("\r\n");
}
