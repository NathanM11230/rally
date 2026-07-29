import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { validateSignupAccess } from "../lib/signup-access";

const originalEnv = {
  SIGNUP_ALLOWED_EMAILS: process.env.SIGNUP_ALLOWED_EMAILS,
  SIGNUP_INVITE_CODE: process.env.SIGNUP_INVITE_CODE,
};

afterEach(() => {
  restoreEnv("SIGNUP_ALLOWED_EMAILS", originalEnv.SIGNUP_ALLOWED_EMAILS);
  restoreEnv("SIGNUP_INVITE_CODE", originalEnv.SIGNUP_INVITE_CODE);
});

test("signup access fails closed when no gate is configured", () => {
  delete process.env.SIGNUP_ALLOWED_EMAILS;
  delete process.env.SIGNUP_INVITE_CODE;

  const result = validateSignupAccess({
    email: "pro@example.com",
    inviteCode: "anything",
  });

  assert.equal(result.ok, false);
});

test("signup access accepts a matching invite code", () => {
  delete process.env.SIGNUP_ALLOWED_EMAILS;
  process.env.SIGNUP_INVITE_CODE = "long-random-club-code";

  const result = validateSignupAccess({
    email: "new-pro@example.com",
    inviteCode: "long-random-club-code",
  });

  assert.equal(result.ok, true);
});

test("signup access rejects empty or incorrect invite codes", () => {
  delete process.env.SIGNUP_ALLOWED_EMAILS;
  process.env.SIGNUP_INVITE_CODE = "long-random-club-code";

  assert.equal(
    validateSignupAccess({
      email: "new-pro@example.com",
      inviteCode: "",
    }).ok,
    false,
  );
  assert.equal(
    validateSignupAccess({
      email: "new-pro@example.com",
      inviteCode: "wrong-code",
    }).ok,
    false,
  );
});

test("signup access accepts allowlisted emails case-insensitively", () => {
  process.env.SIGNUP_ALLOWED_EMAILS = "ProOne@example.com,protwo@example.com";
  delete process.env.SIGNUP_INVITE_CODE;

  const result = validateSignupAccess({
    email: "proone@example.com",
    inviteCode: "",
  });

  assert.equal(result.ok, true);
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
