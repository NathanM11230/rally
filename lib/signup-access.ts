import { timingSafeEqual } from "node:crypto";

type SignupAccessInput = {
  email: string;
  inviteCode: string;
};

export function validateSignupAccess({ email, inviteCode }: SignupAccessInput) {
  const allowedEmails = getAllowedEmails();
  const configuredInviteCode = process.env.SIGNUP_INVITE_CODE?.trim() ?? "";
  const hasSignupGate = allowedEmails.length > 0 || configuredInviteCode.length > 0;

  if (!hasSignupGate) {
    return {
      ok: false as const,
      error: "Signup is not open. Ask the club admin for an invite.",
    };
  }

  if (allowedEmails.includes(email.trim().toLowerCase())) {
    return { ok: true as const };
  }

  if (
    configuredInviteCode &&
    inviteCode &&
    safeStringEquals(inviteCode.trim(), configuredInviteCode)
  ) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    error: "Invalid invite code or email is not allowed.",
  };
}

function getAllowedEmails() {
  return (process.env.SIGNUP_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function safeStringEquals(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
