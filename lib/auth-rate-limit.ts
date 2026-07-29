const AUTH_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 10;

type AuthRateLimitAction = "login" | "signup";

type AttemptWindow = {
  count: number;
  resetAt: number;
};

type CheckRateLimitInput = {
  key: string;
  now?: number;
  maxAttempts?: number;
  windowMs?: number;
};

const attempts = new Map<string, AttemptWindow>();

export function enforceAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
) {
  return checkAuthRateLimit({
    key: `${action}:${getClientIp(request.headers)}`,
  });
}

export function checkAuthRateLimit({
  key,
  now = Date.now(),
  maxAttempts = AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  windowMs = AUTH_RATE_LIMIT_WINDOW_MS,
}: CheckRateLimitInput) {
  const existingWindow = attempts.get(key);

  if (!existingWindow || existingWindow.resetAt <= now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { ok: true as const };
  }

  if (existingWindow.count >= maxAttempts) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.ceil((existingWindow.resetAt - now) / 1000),
    };
  }

  existingWindow.count += 1;
  return { ok: true as const };
}

export function resetAuthRateLimitForTests() {
  attempts.clear();
}

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
