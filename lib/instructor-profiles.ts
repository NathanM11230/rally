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

export async function getInstructorProfileByUserId(userId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createOrClaimInstructorProfileForUser(
  userId: string,
  input: Pick<InstructorProfileInsert, "full_name" | "phone_number">,
) {
  const existingProfile = await getInstructorProfileByUserId(userId);

  if (existingProfile) {
    return updateInstructorProfile(existingProfile.id, input);
  }

  const supabase = getSupabaseAdmin();
  const { data: phoneMatch, error: phoneMatchError } = await supabase
    .from("instructor_profiles")
    .select("*")
    .is("user_id", null)
    .eq("phone_number", input.phone_number)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (phoneMatchError) {
    throw phoneMatchError;
  }

  const matchingProfile =
    phoneMatch ?? (await getUnclaimedInstructorProfileByName(input.full_name));

  if (matchingProfile) {
    return updateInstructorProfile(matchingProfile.id, {
      ...input,
      user_id: userId,
    });
  }

  return createInstructorProfile({
    ...input,
    user_id: userId,
  });
}

async function getUnclaimedInstructorProfileByName(fullName: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("*")
    .is("user_id", null)
    .eq("full_name", fullName)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
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
