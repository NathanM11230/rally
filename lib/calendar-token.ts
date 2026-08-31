import { createHmac, timingSafeEqual } from "node:crypto";

const CALENDAR_TOKEN_PREFIX = "rally-calendar-v3";
const CALENDAR_TOKEN_TTL_SECONDS = 60 * 15;

export type LessonCalendarTokenPayload = {
  instructorProfileId: string;
  tokenVersion: number;
  expiresAt: number;
};

export function buildLessonCalendarToken(
  lessonId: string,
  instructorProfileId: string,
  tokenVersion = 0,
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
    tokenVersion,
    expiresAt,
  );

  return `${expiresAt}.${instructorProfileId}.${tokenVersion}.${signature}`;
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

  const [
    expiresAtRaw,
    instructorProfileId,
    tokenVersionRaw,
    signature,
    ...extraParts
  ] =
    token.split(".");
  const expiresAt = Number(expiresAtRaw);
  const tokenVersion = Number(tokenVersionRaw);

  if (
    extraParts.length > 0 ||
    !expiresAtRaw ||
    !instructorProfileId ||
    !tokenVersionRaw ||
    !signature ||
    !Number.isInteger(expiresAt) ||
    !Number.isInteger(tokenVersion) ||
    tokenVersion < 0 ||
    expiresAt < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const expectedSignature = buildTokenSignature(
    secret,
    lessonId,
    instructorProfileId,
    tokenVersion,
    expiresAt,
  );

  if (!safeStringEquals(signature, expectedSignature)) {
    return null;
  }

  return { instructorProfileId, tokenVersion, expiresAt };
}

function buildTokenSignature(
  secret: string,
  lessonId: string,
  instructorProfileId: string,
  tokenVersion: number,
  expiresAt: number,
) {
  return createHmac("sha256", secret)
    .update(
      `${CALENDAR_TOKEN_PREFIX}:${lessonId}:${instructorProfileId}:${tokenVersion}:${expiresAt}`,
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
