import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-session";
import {
  clearAuthCookies,
  getCurrentProfile,
  getSupabaseAuthClient,
} from "@/lib/auth";
import { invalidateInstructorCalendarTokens } from "@/lib/instructor-profiles";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  try {
    const current = await getCurrentProfile();

    if (current?.profile) {
      await invalidateInstructorCalendarTokens(
        current.profile.id,
        current.profile.calendar_token_version ?? 0,
      );
    }
  } catch (error) {
    console.error("Unable to invalidate Rally calendar links.", error);
  }

  if (refreshToken) {
    try {
      let tokenToRevoke = accessToken;

      if (!tokenToRevoke) {
        const supabase = getSupabaseAuthClient();
        const { data } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        tokenToRevoke = data.session?.access_token;
      }

      if (tokenToRevoke) {
        const admin = getSupabaseAdmin();
        const { error: signOutError } = await admin.auth.admin.signOut(
          tokenToRevoke,
          "global",
        );

        if (signOutError) {
          console.error("Unable to revoke Rally refresh session.", signOutError);
        }
      }
    } catch (error) {
      // Local logout must still succeed if Supabase is temporarily unavailable.
      console.error("Unable to revoke Rally refresh session.", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);

  return response;
}
