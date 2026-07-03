import type { LessonStudentInput } from "@/lib/lesson-input";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  LessonInsert,
  LessonStudentInsert,
  LessonUpdate,
  LessonWithInstructorProfile,
} from "@/types/database";

const lessonSelect = "*, instructor_profile:instructor_profiles(*), lesson_students(*)";

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

  return normalizeLessons(data as LessonWithInstructorProfile[]);
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

  return normalizeLesson(data as LessonWithInstructorProfile);
}

export async function createLesson(input: LessonInsert, students: LessonStudentInput[]) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("lessons").insert(input).select("id").single();

  if (error) {
    throw error;
  }

  await replaceLessonStudents(data.id, students);

  const lesson = await getLesson(data.id);

  if (!lesson) {
    throw new Error("Lesson was created but could not be loaded.");
  }

  return lesson;
}

export async function updateLesson(
  id: string,
  input: LessonUpdate,
  students?: LessonStudentInput[],
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("lessons").update(input).eq("id", id);

  if (error) {
    throw error;
  }

  if (students) {
    await replaceLessonStudents(id, students);
  }

  const lesson = await getLesson(id);

  if (!lesson) {
    throw new Error("Lesson was updated but could not be loaded.");
  }

  return lesson;
}

export async function markLessonReminderSent(id: string, reminderSent: boolean) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("lessons")
    .update({
      reminder_sent: reminderSent,
      reminder_sent_at: reminderSent ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  const lesson = await getLesson(id);

  if (!lesson) {
    throw new Error("Lesson reminder status was updated but could not be loaded.");
  }

  return lesson;
}

export async function deleteLesson(id: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

async function replaceLessonStudents(lessonId: string, students: LessonStudentInput[]) {
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from("lesson_students")
    .delete()
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw deleteError;
  }

  const rows: LessonStudentInsert[] = students.map((student, index) => ({
    lesson_id: lessonId,
    student_name: student.student_name,
    student_phone: student.student_phone,
    sort_order: index,
  }));

  const { error: insertError } = await supabase.from("lesson_students").insert(rows);

  if (insertError) {
    throw insertError;
  }
}

function normalizeLessons(lessons: LessonWithInstructorProfile[]) {
  return lessons.map(normalizeLesson);
}

function normalizeLesson(lesson: LessonWithInstructorProfile) {
  return {
    ...lesson,
    lesson_students: [...(lesson.lesson_students ?? [])].sort(
      (first, second) => first.sort_order - second.sort_order,
    ),
  };
}
