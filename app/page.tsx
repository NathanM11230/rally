import Link from "next/link";

import { AddToCalendarLink } from "@/components/AddToCalendarLink";
import { ManualReminderActions } from "@/components/ManualReminderActions";
import { requireCurrentProfile } from "@/lib/auth";
import {
  formatDateKeyInTimeZone,
  formatLessonDateTime,
  formatLessonTime,
  getLessonTimeZone,
} from "@/lib/date";
import { getLessonInstructorNames } from "@/lib/lesson-instructors";
import {
  getLessonStatus,
  getLessonStatusClass,
  lessonStatusLabels,
} from "@/lib/lesson-status";
import { getUpcomingLessonsForInstructor } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";
import { getSessionLabel } from "@/lib/session-types";
import type { LessonWithInstructorProfile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile } = await requireCurrentProfile();
  let lessons = null;
  const timeZone = getLessonTimeZone();

  try {
    lessons = await getUpcomingLessonsForInstructor(profile.id);
  } catch (error) {
    console.error("Unable to load Rally dashboard.", error);
    lessons = null;
  }

  if (!lessons) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="lede">
              Rally could not load the dashboard. Try again in a moment.
            </p>
          </div>
        </header>
        <section className="panel">
          <div className="setup-note">
            If this continues, check the Supabase connection and Vercel logs.
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
      </header>

      {lessons.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No upcoming lessons assigned to you. Create your first lesson to start scheduling
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
                    currentInstructorProfileId={profile.id}
                    calendarTokenVersion={profile.calendar_token_version ?? 0}
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
                    currentInstructorProfileId={profile.id}
                    calendarTokenVersion={profile.calendar_token_version ?? 0}
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
  currentInstructorProfileId,
  calendarTokenVersion,
}: {
  lesson: LessonWithInstructorProfile;
  timeZone: string;
  showDate: boolean;
  currentInstructorProfileId: string;
  calendarTokenVersion: number;
}) {
  const students = getLessonStudents(lesson);
  const status = getLessonStatus(lesson);
  const sessionLabel = getSessionLabel(lesson);
  const participantSummary =
    students.length > 0
      ? students.map((student) => student.student_name).join(", ")
      : sessionLabel;

  return (
    <div className="lesson-card">
      <div className="lesson-card-header">
        <div className="lesson-card-time">
          {showDate
            ? formatLessonDateTime(lesson, timeZone)
            : formatLessonTime(lesson, timeZone)}
          <span className="lesson-card-location">{lesson.location}</span>
        </div>
        <div className="lesson-card-pills">
          <span className={`status-pill ${getLessonStatusClass(status)}`}>
            {lessonStatusLabels[status]}
          </span>
          <span
            className={`status-pill ${
              lesson.reminder_sent ? "status-sent" : "status-not-sent"
            }`}
          >
            {lesson.reminder_sent ? "Sent" : "Not sent"}
          </span>
        </div>
      </div>
      <div className="lesson-card-body">
        <span className="lesson-card-students">{participantSummary}</span>
        <span className="lesson-card-pro">
          {students.length > 0 ? `${sessionLabel} - ` : ""}
          {getLessonInstructorNames(lesson)}
        </span>
      </div>
      {lesson.notes ? (
        <p className="lesson-card-notes">{lesson.notes}</p>
      ) : null}
      <div className="lesson-card-actions">
        <ManualReminderActions
          lesson={lesson}
          timeZone={timeZone}
          currentInstructorProfileId={currentInstructorProfileId}
        />
        <AddToCalendarLink
          lessonId={lesson.id}
          instructorProfileId={currentInstructorProfileId}
          calendarTokenVersion={calendarTokenVersion}
        />
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
