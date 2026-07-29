import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  checkAuthRateLimit,
  enforceAuthRateLimit,
  resetAuthRateLimitForTests,
} from "../lib/auth-rate-limit";

afterEach(() => {
  resetAuthRateLimitForTests();
});

test("auth rate limiting blocks after the maximum attempts", () => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    assert.equal(
      checkAuthRateLimit({
        key: "signup:127.0.0.1",
        maxAttempts: 3,
        now: 1_000,
        windowMs: 60_000,
      }).ok,
      true,
    );
  }

  const blocked = checkAuthRateLimit({
    key: "signup:127.0.0.1",
    maxAttempts: 3,
    now: 1_001,
    windowMs: 60_000,
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterSeconds, 60);
});

test("auth rate limiting resets after the window expires", () => {
  assert.equal(
    checkAuthRateLimit({
      key: "login:127.0.0.1",
      maxAttempts: 1,
      now: 1_000,
      windowMs: 60_000,
    }).ok,
    true,
  );
  assert.equal(
    checkAuthRateLimit({
      key: "login:127.0.0.1",
      maxAttempts: 1,
      now: 1_001,
      windowMs: 60_000,
    }).ok,
    false,
  );
  assert.equal(
    checkAuthRateLimit({
      key: "login:127.0.0.1",
      maxAttempts: 1,
      now: 61_000,
      windowMs: 60_000,
    }).ok,
    true,
  );
});

test("auth rate limiting separates request actions by client ip", () => {
  const request = new Request("https://rally.test/api/auth/signup", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 70.41.3.18",
    },
  });

  assert.equal(enforceAuthRateLimit(request, "signup").ok, true);
  assert.equal(
    checkAuthRateLimit({
      key: "login:203.0.113.10",
      maxAttempts: 1,
    }).ok,
    true,
  );
});
