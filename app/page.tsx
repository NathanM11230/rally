import Link from "next/link";

import { ManualReminderActions } from "@/components/ManualReminderActions";
import {
  formatDateKeyInTimeZone,
  formatLessonDateTime,
  formatLessonTime,
  getLessonTimeZone,
} from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import { getUpcomingLessons } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";
import type { LessonWithInstructorProfile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let lessons = null;
  let profiles = null;
  const timeZone = getLessonTimeZone();

  try {
    [lessons, profiles] = await Promise.all([
      getUpcomingLessons(),
      getInstructorProfiles(),
    ]);
  } catch {
    lessons = null;
    profiles = null;
  }

  if (!lessons || !profiles) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="lede">
              Add your Supabase environment variables before the dashboard can
              load.
            </p>
          </div>
        </header>
        <section className="panel">
          <div className="setup-note">
            Set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>,
            then restart the dev server.
          </div>
        </section>
      </main>
    );
  }

  const todayKey = formatDateKeyInTimeZone(new Date(), timeZone);
  const todayLessons = lessons.filter(
    (l) =>
      formatDateKeyInTimeZone(new Date(l.lesson_start_time), timeZone) ===
      todayKey,
  );
  const upcomingLessons = lessons.filter(
    (l) =>
      formatDateKeyInTimeZone(new Date(l.lesson_start_time), timeZone) !==
      todayKey,
  );
  const pendingReminders = lessons.filter((l) => !l.reminder_sent).length;

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(new Date());

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">{todayFormatted}</p>
        </div>
        {profiles.length === 0 ? (
          <Link className="button" href="/profile">
            Add club pros
          </Link>
        ) : null}
      </header>

      {profiles.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            Add at least one club pro before creating lessons. Rally uses the
            pro&apos;s name and phone number to prepare reminder texts.
            <div className="button-row section-actions">
              <Link className="button" href="/profile">
                Add club pros
              </Link>
            </div>
          </div>
        </section>
      ) : lessons.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No upcoming lessons. Create your first lesson to start scheduling
            reminders.
            <div className="button-row section-actions">
              <Link className="button" href="/lessons/new">
                New lesson
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="stats-row" aria-label="Summary">
            <span>
              <strong>{todayLessons.length}</strong> today
            </span>
            <span>
              <strong>{lessons.length}</strong> upcoming
            </span>
            <span>
              <strong>{pendingReminders}</strong> unsent
            </span>
          </div>

          <section className="dash-section">
            <h2 className="section-title">Today</h2>
            {todayLessons.length === 0 ? (
              <p className="section-empty">No lessons today.</p>
            ) : (
              <div className="lesson-cards">
                {todayLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    timeZone={timeZone}
                    showDate={false}
                  />
                ))}
              </div>
            )}
          </section>

          {upcomingLessons.length > 0 ? (
            <section className="dash-section">
              <h2 className="section-title">Upcoming</h2>
              <div className="lesson-cards">
                {upcomingLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    timeZone={timeZone}
                    showDate
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function LessonCard({
  lesson,
  timeZone,
  showDate,
}: {
  lesson: LessonWithInstructorProfile;
  timeZone: string;
  showDate: boolean;
}) {
  const students = getLessonStudents(lesson);

  return (
    <div className="lesson-card">
      <div className="lesson-card-header">
        <div className="lesson-card-time">
          {showDate
            ? formatLessonDateTime(lesson, timeZone)
            : formatLessonTime(lesson, timeZone)}
          <span className="lesson-card-location">{lesson.location}</span>
        </div>
        <span
          className={`status-pill ${
            lesson.reminder_sent ? "status-sent" : "status-not-sent"
          }`}
        >
          {lesson.reminder_sent ? "Sent" : "Not sent"}
        </span>
      </div>
      <div className="lesson-card-body">
        <span className="lesson-card-students">
          {students.map((s) => s.student_name).join(", ")}
        </span>
        <span className="lesson-card-pro">
          {lesson.instructor_profile?.full_name ?? "No pro assigned"}
        </span>
      </div>
      {lesson.notes ? (
        <p className="lesson-card-notes">{lesson.notes}</p>
      ) : null}
      <div className="lesson-card-actions">
        <ManualReminderActions lesson={lesson} timeZone={timeZone} />
        <Link
          className="button-secondary compact-button"
          href={`/lessons/${lesson.id}/edit`}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
