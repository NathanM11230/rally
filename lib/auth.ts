import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, type Session, type User } from "@supabase/supabase-js";

import { getInstructorProfileByUserId } from "@/lib/instructor-profiles";
import type { Database, InstructorProfile } from "@/types/database";

const ACCESS_TOKEN_COOKIE = "rally-access-token";
const REFRESH_TOKEN_COOKIE = "rally-refresh-token";

export type AuthenticatedProfile = {
  user: User;
  profile: InstructorProfile;
};

export function getSupabaseAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase auth configuration. Set SUPABASE_ANON_KEY.");
  }

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await getInstructorProfileByUserId(user.id);

  return profile ? { user, profile } : { user, profile: null };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireCurrentProfile(): Promise<AuthenticatedProfile> {
  const user = await requireUser();
  const profile = await getInstructorProfileByUserId(user.id);

  if (!profile) {
    redirect("/profile");
  }

  return { user, profile };
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
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: ResponseWithCookies) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

type ResponseWithCookies = Response & {
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
