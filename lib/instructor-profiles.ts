import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  InstructorProfileInsert,
  InstructorProfileUpdate,
} from "@/types/database";

export async function getCurrentInstructorProfile() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveCurrentInstructorProfile(input: InstructorProfileInsert) {
  const existingProfile = await getCurrentInstructorProfile();

  if (existingProfile) {
    return updateInstructorProfile(existingProfile.id, input);
  }

  return createInstructorProfile(input);
}

async function createInstructorProfile(input: InstructorProfileInsert) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("instructor_profiles")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateInstructorProfile(id: string, input: InstructorProfileUpdate) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("instructor_profiles")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
