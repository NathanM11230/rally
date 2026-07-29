import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCalendarLink } from "@/components/AddToCalendarLink";
import { DeleteLessonButton } from "@/components/DeleteLessonButton";
import { LessonForm } from "@/components/LessonForm";
import { LessonStatusSelect } from "@/components/LessonStatusSelect";
import { ManualReminderActions } from "@/components/ManualReminderActions";
import { requireCurrentProfile } from "@/lib/auth";
import { getContactDirectory } from "@/lib/contacts";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import {
  getLessonStatus,
  getLessonStatusClass,
  lessonStatusLabels,
} from "@/lib/lesson-status";
import { getLesson, isLessonAssignedToInstructor } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";
import { getSessionLabel } from "@/lib/session-types";

type EditLessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id } = await params;
  const { profile } = await requireCurrentProfile();
  const timeZone = getLessonTimeZone();
  const [lesson, instructorProfiles, contacts] = await Promise.all([
    getLesson(id),
    getInstructorProfiles(),
    getContactDirectory().catch(() => []),
  ]);

  if (!lesson) {
    notFound();
  }

  if (!isLessonAssignedToInstructor(lesson, profile.id)) {
    notFound();
  }

  const status = getLessonStatus(lesson);
  const students = getLessonStudents(lesson);
  const heading =
    students.length > 0
      ? students.map((student) => student.student_name).join(", ")
      : getSessionLabel(lesson);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>{heading}</h1>
          <div className="details-bar">
            <span className="detail-chip">{formatLessonDateTime(lesson, timeZone)}</span>
            <span className="detail-chip">{getSessionLabel(lesson)}</span>
            <span className="detail-chip">{lesson.location}</span>
            <span className={`status-pill ${getLessonStatusClass(status)}`}>
              {lessonStatusLabels[status]}
            </span>
            <span
              className={`status-pill ${lesson.reminder_sent ? "status-sent" : "status-not-sent"}`}
            >
              {lesson.reminder_sent ? "Sent" : "Not sent"}
            </span>
          </div>
        </div>
        <Link className="button-secondary" href="/">
          Dashboard
        </Link>
      </header>

      <section className="panel lesson-tools">
        <div className="lesson-tool-copy">
          <h2>Reminder tools</h2>
          <p>
            Open the prefilled texts, send them from your phone, then mark the
            reminder as sent.
          </p>
        </div>
        <div className="lesson-tool-actions">
          <LessonStatusSelect lessonId={lesson.id} status={status} />
          <ManualReminderActions
            lesson={lesson}
            timeZone={timeZone}
            currentInstructorProfileId={profile.id}
          />
          <AddToCalendarLink lessonId={lesson.id} instructorProfileId={profile.id} />
          <DeleteLessonButton lessonId={lesson.id} />
        </div>
      </section>

      <section className="panel">
        <LessonForm
          mode="edit"
          lesson={lesson}
          timeZone={timeZone}
          instructorProfiles={instructorProfiles}
          contacts={contacts}
        />
      </section>
    </main>
  );
}
