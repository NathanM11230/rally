import assert from "node:assert/strict";
import { test } from "node:test";

import {
  dateAndTimeToUtc,
  getLessonFormDateTime,
  isValidDateTimeInTimeZone,
} from "../lib/date";

const TIME_ZONE = "America/New_York";

test("local lesson times convert correctly in standard and daylight time", () => {
  assert.equal(
    dateAndTimeToUtc("2026-01-15", "09:15", TIME_ZONE).toISOString(),
    "2026-01-15T14:15:00.000Z",
  );
  assert.equal(
    dateAndTimeToUtc("2026-07-15", "09:15", TIME_ZONE).toISOString(),
    "2026-07-15T13:15:00.000Z",
  );
});

test("lesson form values round-trip through UTC", () => {
  const lessonStart = dateAndTimeToUtc("2026-07-15", "18:30", TIME_ZONE);

  assert.deepEqual(
    getLessonFormDateTime(
      { lesson_start_time: lessonStart.toISOString() },
      TIME_ZONE,
    ),
    {
      lesson_date: "2026-07-15",
      lesson_time: "18:30",
    },
  );
});

test("spring-forward gap and invalid calendar dates are rejected", () => {
  assert.equal(
    isValidDateTimeInTimeZone("2026-03-08", "02:30", TIME_ZONE),
    false,
  );
  assert.equal(
    isValidDateTimeInTimeZone("2026-02-30", "09:00", TIME_ZONE),
    false,
  );
});

test("fall-back chooses a valid occurrence of the repeated local time", () => {
  assert.equal(
    isValidDateTimeInTimeZone("2026-11-01", "01:30", TIME_ZONE),
    true,
  );
  assert.equal(
    dateAndTimeToUtc("2026-11-01", "01:30", TIME_ZONE).toISOString(),
    "2026-11-01T05:30:00.000Z",
  );
});
