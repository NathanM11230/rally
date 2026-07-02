import { getLessonTimeZone } from "@/lib/date";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendLessonReminderMessages } from "@/lib/twilio";
import type { LessonWithInstructorProfile } from "@/types/database";

type ReminderSuccess = {
  lessonId: string;
  studentName: string;
  instructorName: string;
  studentMessageSid: string;
  instructorMessageSid: string;
};

type ReminderFailure = {
  lessonId: string;
  studentName: string;
  error: string;
};

export type ReminderRunResult = {
  checkedAt: string;
  timeZone: string;
  windowStart: string;
  windowEnd: string;
  dueCount: number;
  sent: ReminderSuccess[];
  failed: ReminderFailure[];
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function sendDueLessonReminders(): Promise<ReminderRunResult> {
  const timeZone = getLessonTimeZone();
  const windowMinutes = Number(process.env.REMINDER_WINDOW_MINUTES || "60");
  const windowMs = windowMinutes * 60 * 1000;
  const now = new Date();
  const target = new Date(now.getTime() + DAY_IN_MS);
  const windowStart = new Date(target.getTime() - windowMs);
  const windowEnd = new Date(target.getTime() + windowMs);
  const lessons = await findLessonsDueForReminder(windowStart, windowEnd);
  const sent: ReminderSuccess[] = [];
  const failed: ReminderFailure[] = [];

  for (const lesson of lessons) {
    if (!lesson.instructor_profile) {
      failed.push({
        lessonId: lesson.id,
        studentName: lesson.student_name,
        error: "Lesson is missing an instructor profile.",
      });
      continue;
    }

    try {
      const result = await sendLessonReminderMessages(
        {
          ...lesson,
          instructor_profile: lesson.instructor_profile,
        },
        timeZone,
      );
      await markReminderSent(lesson.id);

      sent.push({
        lessonId: lesson.id,
        studentName: lesson.student_name,
        instructorName: lesson.instructor_profile.full_name,
        studentMessageSid: result.studentMessageSid,
        instructorMessageSid: result.instructorMessageSid,
      });
    } catch (error) {
      failed.push({
        lessonId: lesson.id,
        studentName: lesson.student_name,
        error: error instanceof Error ? error.message : "Unknown reminder error.",
      });
    }
  }

  return {
    checkedAt: now.toISOString(),
    timeZone,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    dueCount: lessons.length,
    sent,
    failed,
  };
}

async function findLessonsDueForReminder(windowStart: Date, windowEnd: Date) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("lessons")
    .select("*, instructor_profile:instructor_profiles(*)")
    .eq("reminder_sent", false)
    .gte("lesson_start_time", windowStart.toISOString())
    .lte("lesson_start_time", windowEnd.toISOString())
    .order("lesson_start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data as LessonWithInstructorProfile[];
}

async function markReminderSent(lessonId: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("lessons")
    .update({
      reminder_sent: true,
      reminder_sent_at: new Date().toISOString(),
    })
    .eq("id", lessonId)
    .eq("reminder_sent", false);

  if (error) {
    throw error;
  }
}
