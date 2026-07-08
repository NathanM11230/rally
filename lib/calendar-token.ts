import { createHmac, timingSafeEqual } from "node:crypto";

const CALENDAR_TOKEN_PREFIX = "rally-calendar-v1";

export function buildLessonCalendarToken(lessonId: string) {
  const secret = getCalendarTokenSecret();

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret)
    .update(buildTokenPayload(lessonId))
    .digest("base64url");
}

export function isValidLessonCalendarToken(lessonId: string, token: string | null) {
  if (!token) {
    return false;
  }

  const expectedToken = buildLessonCalendarToken(lessonId);

  if (!expectedToken) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, tokenBuffer);
}

function buildTokenPayload(lessonId: string) {
  return `${CALENDAR_TOKEN_PREFIX}:${lessonId}`;
}

function getCalendarTokenSecret() {
  return process.env.CALENDAR_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}
