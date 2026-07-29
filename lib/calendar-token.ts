import { createHmac, timingSafeEqual } from "node:crypto";

const CALENDAR_TOKEN_PREFIX = "rally-calendar-v2";
const CALENDAR_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;

export type LessonCalendarTokenPayload = {
  instructorProfileId: string;
  expiresAt: number;
};

export function buildLessonCalendarToken(
  lessonId: string,
  instructorProfileId: string,
) {
  const secret = getCalendarTokenSecret();

  if (!secret) {
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + CALENDAR_TOKEN_TTL_SECONDS;
  const signature = buildTokenSignature(
    secret,
    lessonId,
    instructorProfileId,
    expiresAt,
  );

  return `${expiresAt}.${instructorProfileId}.${signature}`;
}

export function getValidLessonCalendarTokenPayload(
  lessonId: string,
  token: string | null,
): LessonCalendarTokenPayload | null {
  if (!token) {
    return null;
  }

  const secret = getCalendarTokenSecret();

  if (!secret) {
    return null;
  }

  const [expiresAtRaw, instructorProfileId, signature, ...extraParts] =
    token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (
    extraParts.length > 0 ||
    !expiresAtRaw ||
    !instructorProfileId ||
    !signature ||
    !Number.isInteger(expiresAt) ||
    expiresAt < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const expectedSignature = buildTokenSignature(
    secret,
    lessonId,
    instructorProfileId,
    expiresAt,
  );

  if (!safeStringEquals(signature, expectedSignature)) {
    return null;
  }

  return { instructorProfileId, expiresAt };
}

function buildTokenSignature(
  secret: string,
  lessonId: string,
  instructorProfileId: string,
  expiresAt: number,
) {
  return createHmac("sha256", secret)
    .update(
      `${CALENDAR_TOKEN_PREFIX}:${lessonId}:${instructorProfileId}:${expiresAt}`,
    )
    .digest("base64url");
}

function getCalendarTokenSecret() {
  return process.env.CALENDAR_TOKEN_SECRET?.trim() || null;
}

function safeStringEquals(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
