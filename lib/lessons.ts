import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  LessonInsert,
  LessonUpdate,
  LessonWithInstructorProfile,
} from "@/types/database";

const lessonSelect = "*, instructor_profile:instructor_profiles(*)";

export async function getUpcomingLessons() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonSelect)
    .gte("lesson_start_time", new Date().toISOString())
    .order("lesson_start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data as LessonWithInstructorProfile[];
}

export async function getLesson(id: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonSelect)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw error;
  }

  return data as LessonWithInstructorProfile;
}

export async function createLesson(input: LessonInsert) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("lessons").insert(input).select(lessonSelect).single();

  if (error) {
    throw error;
  }

  return data as LessonWithInstructorProfile;
}

export async function updateLesson(id: string, input: LessonUpdate) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .update(input)
    .eq("id", id)
    .select(lessonSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as LessonWithInstructorProfile;
}

export async function markLessonReminderSent(id: string, reminderSent: boolean) {
  return updateLesson(id, {
    reminder_sent: reminderSent,
    reminder_sent_at: reminderSent ? new Date().toISOString() : null,
  });
}

export async function deleteLesson(id: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
