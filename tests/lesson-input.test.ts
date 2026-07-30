import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { parseLessonInput } from "../lib/lesson-input";

const originalTimeZone = process.env.LESSON_TIME_ZONE;

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.LESSON_TIME_ZONE;
  } else {
    process.env.LESSON_TIME_ZONE = originalTimeZone;
  }
});

test("valid lesson input preserves multiple pros and participants", () => {
  process.env.LESSON_TIME_ZONE = "America/New_York";
  const result = parseLessonInput(
    {
      instructor_profile_ids: ["pro-1", "pro-2", "pro-1"],
      students: [
        { student_name: "Molly Brown", student_phone: "(412) 555-0101" },
        { student_name: "Ben Sears", student_phone: "(412) 555-0102" },
      ],
      session_type: "lesson",
      lesson_date: "2026-08-04",
      lesson_time: "12:00",
      location: "Tennis Court 3, Tennis Court 4",
      notes: "Work on returns",
    },
    "create",
  );

  assert.equal(result.errors.length, 0);
  assert.ok(result.data);
  assert.deepEqual(result.data.instructorProfileIds, ["pro-1", "pro-2"]);
  assert.equal(result.data.students.length, 2);
  assert.equal(result.data.lesson.lesson_start_time, "2026-08-04T16:00:00.000Z");
  assert.equal(result.data.lesson.reminder_sent, false);
});

test("lesson times must use quarter hours within the booking window", () => {
  assert.deepEqual(parseLessonInput(buildLesson({ lesson_time: "08:07" }), "create").errors, [
    "lesson_time must be in 15-minute intervals.",
  ]);
  assert.deepEqual(parseLessonInput(buildLesson({ lesson_time: "05:45" }), "create").errors, [
    "lesson_time must be between 6:00 AM and 9:00 PM.",
  ]);
  assert.deepEqual(parseLessonInput(buildLesson({ lesson_time: "21:15" }), "create").errors, [
    "lesson_time must be between 6:00 AM and 9:00 PM.",
  ]);
});

test("lessons require a participant while other events require an event name", () => {
  const lessonErrors: string[] = [
    ...parseLessonInput(buildLesson({ students: [] }), "create").errors,
  ];
  const eventErrors: string[] = [
    ...parseLessonInput(
      buildLesson({
        session_type: "other_event",
        students: [],
        event_title: "",
      }),
      "create",
    ).errors,
  ];

  assert.ok(
    lessonErrors.includes(
      "At least one student name and phone number is required for lessons.",
    ),
  );
  assert.ok(eventErrors.includes("Other event name is required."));
});

test("nonexistent daylight-saving times are rejected", () => {
  process.env.LESSON_TIME_ZONE = "America/New_York";
  const result = parseLessonInput(
    buildLesson({
      lesson_date: "2026-03-08",
      lesson_time: "02:30",
    }),
    "create",
  );

  const errors: string[] = [...result.errors];

  assert.ok(
    errors.includes("lesson_date and lesson_time must be a valid local date and time."),
  );
});

function buildLesson(overrides: Record<string, unknown> = {}) {
  return {
    instructor_profile_ids: ["pro-1"],
    students: [
      { student_name: "Molly Brown", student_phone: "(412) 555-0101" },
    ],
    session_type: "lesson",
    lesson_date: "2026-08-04",
    lesson_time: "12:00",
    location: "Tennis Court 3",
    notes: "",
    ...overrides,
  };
}
