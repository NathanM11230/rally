import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  InstructorProfileInsert,
  InstructorProfileUpdate,
} from "@/types/database";

export async function getInstructorProfiles() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function getInstructorProfile(id: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw error;
  }

  return data;
}

export async function createInstructorProfile(input: InstructorProfileInsert) {
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

export async function updateInstructorProfile(id: string, input: InstructorProfileUpdate) {
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
