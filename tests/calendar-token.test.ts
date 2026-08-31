import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  buildLessonCalendarToken,
  getValidLessonCalendarTokenPayload,
} from "../lib/calendar-token";

const originalCalendarSecret = process.env.CALENDAR_TOKEN_SECRET;
const originalDateNow = Date.now;
const baseTimeMs = 1_800_000_000_000;

afterEach(() => {
  restoreEnv("CALENDAR_TOKEN_SECRET", originalCalendarSecret);
  Date.now = originalDateNow;
});

test("calendar tokens are not generated without a calendar secret", () => {
  delete process.env.CALENDAR_TOKEN_SECRET;

  const token = buildLessonCalendarToken("lesson-1", "profile-1");

  assert.equal(token, null);
});

test("calendar tokens validate and expose the bound pro profile", () => {
  process.env.CALENDAR_TOKEN_SECRET = "calendar-secret-for-tests";
  Date.now = () => baseTimeMs;

  const token = buildLessonCalendarToken("lesson-1", "profile-1");
  const payload = getValidLessonCalendarTokenPayload("lesson-1", token);

  assert.equal(payload?.instructorProfileId, "profile-1");
  assert.equal(payload?.tokenVersion, 0);
  assert.equal(typeof payload?.expiresAt, "number");
});

test("calendar tokens carry the profile revocation version", () => {
  process.env.CALENDAR_TOKEN_SECRET = "calendar-secret-for-tests";
  Date.now = () => baseTimeMs;

  const token = buildLessonCalendarToken("lesson-1", "profile-1", 4);
  const payload = getValidLessonCalendarTokenPayload("lesson-1", token);

  assert.equal(payload?.tokenVersion, 4);
});

test("calendar tokens reject a different lesson id", () => {
  process.env.CALENDAR_TOKEN_SECRET = "calendar-secret-for-tests";
  Date.now = () => baseTimeMs;

  const token = buildLessonCalendarToken("lesson-1", "profile-1");
  const payload = getValidLessonCalendarTokenPayload("lesson-2", token);

  assert.equal(payload, null);
});

test("calendar tokens reject tampered profile ids", () => {
  process.env.CALENDAR_TOKEN_SECRET = "calendar-secret-for-tests";
  Date.now = () => baseTimeMs;

  const token = buildLessonCalendarToken("lesson-1", "profile-1");
  assert.ok(token);
  const [expiresAt, , tokenVersion, signature] = token.split(".");
  const tamperedToken = `${expiresAt}.profile-2.${tokenVersion}.${signature}`;
  const payload = getValidLessonCalendarTokenPayload("lesson-1", tamperedToken);

  assert.equal(payload, null);
});

test("calendar tokens reject tampered signatures and extra dot sections", () => {
  process.env.CALENDAR_TOKEN_SECRET = "calendar-secret-for-tests";
  Date.now = () => baseTimeMs;

  const token = buildLessonCalendarToken("lesson-1", "profile-1");
  assert.ok(token);
  const tamperedSignature = `${token.slice(0, -1)}x`;

  assert.equal(
    getValidLessonCalendarTokenPayload("lesson-1", tamperedSignature),
    null,
  );
  assert.equal(
    getValidLessonCalendarTokenPayload("lesson-1", `${token}.extra`),
    null,
  );
});

test("calendar tokens reject expired tokens", () => {
  process.env.CALENDAR_TOKEN_SECRET = "calendar-secret-for-tests";
  Date.now = () => baseTimeMs;

  const token = buildLessonCalendarToken("lesson-1", "profile-1");
  Date.now = () => baseTimeMs + 16 * 60 * 1000;

  const payload = getValidLessonCalendarTokenPayload("lesson-1", token);

  assert.equal(payload, null);
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
