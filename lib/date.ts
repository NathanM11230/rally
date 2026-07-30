import type { Lesson } from "@/types/database";

const DEFAULT_TIME_ZONE = "America/New_York";

export function getLessonTimeZone() {
  return process.env.LESSON_TIME_ZONE || DEFAULT_TIME_ZONE;
}

export function formatLessonDateTime(
  lesson: Pick<Lesson, "lesson_start_time">,
  timeZone = DEFAULT_TIME_ZONE,
) {
  const date = new Date(lesson.lesson_start_time);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return formatter.format(date);
}

export function formatLessonTime(
  lesson: Pick<Lesson, "lesson_start_time">,
  timeZone = DEFAULT_TIME_ZONE,
) {
  const date = new Date(lesson.lesson_start_time);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });

  return formatter.format(date);
}

export function formatDateKeyInTimeZone(date: Date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = getZonedParts(date, timeZone);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getCurrentMonthKey(timeZone = DEFAULT_TIME_ZONE) {
  const parts = getZonedParts(new Date(), timeZone);

  return `${parts.year}-${parts.month}`;
}

export function getLessonFormDateTime(
  lesson: Pick<Lesson, "lesson_start_time">,
  timeZone = DEFAULT_TIME_ZONE,
) {
  const parts = getZonedParts(new Date(lesson.lesson_start_time), timeZone);

  return {
    lesson_date: `${parts.year}-${parts.month}-${parts.day}`,
    lesson_time: `${parts.hour}:${parts.minute}`,
  };
}

export function dateAndTimeToUtc(dateValue: string, timeValue: string, timeZone: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = getTimeZoneOffset(new Date(utcGuess), timeZone);
  let utcDate = new Date(utcGuess - offset);

  const correctedOffset = getTimeZoneOffset(utcDate, timeZone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    utcDate = new Date(utcGuess - offset);
  }

  return utcDate;
}

export function isValidDateTimeInTimeZone(
  dateValue: string,
  timeValue: string,
  timeZone: string,
) {
  if (!isValidDateKey(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) {
    return false;
  }

  const converted = dateAndTimeToUtc(dateValue, timeValue, timeZone);
  const parts = getZonedParts(converted, timeZone);

  return (
    `${parts.year}-${parts.month}-${parts.day}` === dateValue &&
    `${parts.hour}:${parts.minute}` === timeValue
  );
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return zonedAsUtc - date.getTime();
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatter.formatToParts(date).reduce<Record<string, string>>((values, part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }

    return values;
  }, {});
}
