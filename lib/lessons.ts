import type { LessonStudentInput } from "@/lib/lesson-input";
import { upsertContactsFromStudents } from "@/lib/contacts";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  LessonInstructorInsert,
  LessonInsert,
  LessonStatus,
  LessonStudentInsert,
  LessonUpdate,
  LessonWithInstructorProfile,
} from "@/types/database";

const lessonSelect =
  "*, instructor_profile:instructor_profiles(*), lesson_students(*), lesson_instructors(*, instructor_profile:instructor_profiles(*))";
const lessonSelectForInstructor =
  `${lessonSelect}, assignment:lesson_instructors!inner(instructor_profile_id)`;
const UPCOMING_LESSON_LIMIT = 1_000;
const LESSON_HISTORY_LIMIT = 5_000;

type LessonCalendarFilters = {
  start: Date;
  end: Date;
  instructorProfileId?: string;
};

export async function getUpcomingLessons() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonSelect)
    .gte("lesson_start_time", new Date().toISOString())
    .order("lesson_start_time", { ascending: true })
    .limit(UPCOMING_LESSON_LIMIT);

  if (error) {
    throw error;
  }

  return normalizeLessons(data as LessonWithInstructorProfile[]);
}

export async function getUpcomingLessonsForInstructor(instructorProfileId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonSelectForInstructor)
    .eq("assignment.instructor_profile_id", instructorProfileId)
    .gte("lesson_start_time", new Date().toISOString())
    .order("lesson_start_time", { ascending: true })
    .limit(UPCOMING_LESSON_LIMIT);

  if (error) {
    throw error;
  }

  return normalizeLessons(data as unknown as LessonWithInstructorProfile[]);
}

export async function getLessonsForInstructor(instructorProfileId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonSelectForInstructor)
    .eq("assignment.instructor_profile_id", instructorProfileId)
    .order("lesson_start_time", { ascending: false })
    .limit(LESSON_HISTORY_LIMIT);

  if (error) {
    throw error;
  }

  return normalizeLessons(data as unknown as LessonWithInstructorProfile[]);
}

export async function getLessonsForCalendar({
  start,
  end,
  instructorProfileId,
}: LessonCalendarFilters) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("lessons")
    .select(instructorProfileId ? lessonSelectForInstructor : lessonSelect)
    .gte("lesson_start_time", start.toISOString())
    .lt("lesson_start_time", end.toISOString())
    .order("lesson_start_time", { ascending: true });

  if (instructorProfileId) {
    query = query.eq("assignment.instructor_profile_id", instructorProfileId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return normalizeLessons(data as unknown as LessonWithInstructorProfile[]);
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

export async function createLesson(
  input: LessonInsert,
  students: LessonStudentInput[],
  instructorProfileIds: string[],
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("lessons").insert(input).select("id").single();

  if (error) {
    throw error;
  }

  await replaceLessonInstructors(data.id, instructorProfileIds);
  await replaceLessonStudents(data.id, students);
  await upsertContactsFromStudents(students);

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
  instructorProfileIds?: string[],
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("lessons").update(input).eq("id", id);

  if (error) {
    throw error;
  }

  if (students) {
    await replaceLessonStudents(id, students);
    await upsertContactsFromStudents(students);
  }

  if (instructorProfileIds) {
    await replaceLessonInstructors(id, instructorProfileIds);
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

export async function updateLessonStatus(id: string, status: LessonStatus) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("lessons").update({ status }).eq("id", id);

  if (error) {
    throw error;
  }

  const lesson = await getLesson(id);

  if (!lesson) {
    throw new Error("Lesson status was updated but could not be loaded.");
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

async function replaceLessonInstructors(lessonId: string, instructorProfileIds: string[]) {
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from("lesson_instructors")
    .delete()
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw deleteError;
  }

  const rows: LessonInstructorInsert[] = instructorProfileIds.map(
    (instructorProfileId, index) => ({
      lesson_id: lessonId,
      instructor_profile_id: instructorProfileId,
      sort_order: index,
    }),
  );

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("lesson_instructors").insert(rows);

  if (insertError) {
    throw insertError;
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

  if (rows.length === 0) {
    return;
  }

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
    lesson_instructors: [...(lesson.lesson_instructors ?? [])].sort(
      (first, second) => first.sort_order - second.sort_order,
    ),
    lesson_students: [...(lesson.lesson_students ?? [])].sort(
      (first, second) => first.sort_order - second.sort_order,
    ),
  };
}

export function isLessonAssignedToInstructor(
  lesson: LessonWithInstructorProfile,
  instructorProfileId: string,
) {
  return (
    lesson.instructor_profile_id === instructorProfileId ||
    (lesson.lesson_instructors ?? []).some(
      (instructor) => instructor.instructor_profile_id === instructorProfileId,
    )
  );
}
