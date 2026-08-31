import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth-session";
import { getInstructorProfileByUserId } from "@/lib/instructor-profiles";
import type { Database, InstructorProfile } from "@/types/database";

export { clearAuthCookies, setAuthCookies };

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

  if (!profile || profile.is_active === false) {
    redirect("/profile");
  }

  return { user, profile };
}
