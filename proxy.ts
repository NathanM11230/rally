import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseAuthClient } from "@/lib/auth";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  shouldRefreshAccessToken,
} from "@/lib/auth-session";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken || !shouldRefreshAccessToken(accessToken)) {
    return NextResponse.next();
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      const response = NextResponse.next();
      clearAuthCookies(response);

      return response;
    }

    request.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token);
    request.cookies.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token);

    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    setAuthCookies(response, data.session);
    response.headers.set("Cache-Control", "private, no-store");

    return response;
  } catch (error) {
    console.error("Unable to refresh Rally auth session.", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
