import Link from "next/link";

import { ManualReminderActions } from "@/components/ManualReminderActions";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import { getUpcomingLessons } from "@/lib/lessons";

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
            <p className="eyebrow">Setup needed</p>
            <h1>Tennis SMS Reminders</h1>
            <p className="lede">
              Add your Supabase environment variables before the dashboard can load
              lessons.
            </p>
          </div>
        </header>
        <section className="panel">
          <div className="setup-note">
            Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then
            restart the dev server. The schema is in `supabase/schema.sql`.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">SMS lesson reminders</p>
          <h1>Upcoming tennis lessons</h1>
          <p className="lede">
            Create lessons, keep court details in one place, and open prefilled
            reminder texts when it is time to send them.
          </p>
        </div>
        <div className="button-row">
          <Link className="button-secondary" href="/profile">
            Manage pros
          </Link>
          {profiles.length > 0 ? (
            <Link className="button-secondary" href="/calendar">
              Calendar
            </Link>
          ) : null}
          {profiles.length > 0 ? (
            <Link className="button" href="/lessons/new">
              New lesson
            </Link>
          ) : null}
        </div>
      </header>

      {profiles.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            Add at least one club pro before creating lessons. Rally will use the
            selected pro&apos;s name and phone number to prepare reminder texts.
            <div className="button-row section-actions">
              <Link className="button" href="/profile">
                Add club pros
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="details-bar profile-bar">
          {profiles.map((profile) => (
            <span className="detail-chip" key={profile.id}>
              {profile.full_name}: {profile.phone_number}
            </span>
          ))}
        </div>
      )}

      <section className="panel">
        {lessons.length === 0 ? (
          <div className="empty-state">
            No upcoming lessons yet. Add your first lesson to start scheduling SMS
            reminder texts.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Instructor</th>
                  <th>Lesson</th>
                  <th>Location</th>
                  <th>Reminder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>
                      <span className="cell-title">
                        {lesson.lesson_students.length > 1
                          ? `${lesson.lesson_students.length} students`
                          : lesson.lesson_students[0]?.student_name ?? lesson.student_name}
                      </span>
                      <span className="cell-subtitle">
                        {lesson.lesson_students.length > 0
                          ? lesson.lesson_students
                              .map((student) => `${student.student_name} (${student.student_phone})`)
                              .join(", ")
                          : lesson.student_phone}
                      </span>
                    </td>
                    <td>
                      <span className="cell-title">
                        {lesson.instructor_profile?.full_name ?? "Missing profile"}
                      </span>
                      <span className="cell-subtitle">
                        {lesson.instructor_profile?.phone_number ?? "No phone number"}
                      </span>
                    </td>
                    <td>{formatLessonDateTime(lesson, timeZone)}</td>
                    <td>
                      <span className="cell-title">{lesson.location}</span>
                      {lesson.notes ? (
                        <span className="cell-subtitle">{lesson.notes}</span>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          lesson.reminder_sent ? "status-sent" : "status-not-sent"
                        }`}
                      >
                        {lesson.reminder_sent ? "Sent" : "Not sent"}
                      </span>
                    </td>
                    <td>
                      <Link className="button-secondary" href={`/lessons/${lesson.id}/edit`}>
                        Edit
                      </Link>
                      <ManualReminderActions lesson={lesson} timeZone={timeZone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
