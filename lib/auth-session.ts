import type { Session } from "@supabase/supabase-js";

export const ACCESS_TOKEN_COOKIE = "rally-access-token";
export const REFRESH_TOKEN_COOKIE = "rally-refresh-token";

const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ACCESS_TOKEN_REFRESH_WINDOW_SECONDS = 60;

export function shouldRefreshAccessToken(
  accessToken: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!accessToken) {
    return true;
  }

  const expiresAt = getJwtExpiration(accessToken);

  return (
    expiresAt === null ||
    expiresAt <= nowSeconds + ACCESS_TOKEN_REFRESH_WINDOW_SECONDS
  );
}

export function setAuthCookies(response: ResponseWithCookies, session: Session) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: session.expires_in,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: ResponseWithCookies) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", options);
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", options);
}

function getJwtExpiration(token: string) {
  const sections = token.split(".");

  if (sections.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(sections[1], "base64url").toString("utf8"),
    ) as { exp?: unknown };

    return typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp
      : null;
  } catch {
    return null;
  }
}

type ResponseWithCookies = {
  cookies: {
    set: (
      name: string,
      value: string,
      options: {
        httpOnly: boolean;
        sameSite: "lax";
        secure: boolean;
        path: string;
        maxAge: number;
      },
    ) => void;
  };
};
