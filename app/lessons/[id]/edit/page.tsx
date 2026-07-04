import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteLessonButton } from "@/components/DeleteLessonButton";
import { LessonForm } from "@/components/LessonForm";
import { ManualReminderActions } from "@/components/ManualReminderActions";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import { getLesson } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";

type EditLessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id } = await params;
  const timeZone = getLessonTimeZone();
  const [lesson, instructorProfiles] = await Promise.all([
    getLesson(id),
    getInstructorProfiles(),
  ]);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Edit lesson</p>
          <h1>{getLessonStudents(lesson).map((student) => student.student_name).join(", ")}</h1>
          <div className="details-bar">
            <span className="detail-chip">{formatLessonDateTime(lesson, timeZone)}</span>
            <span className="detail-chip">{lesson.location}</span>
            <span className="detail-chip">
              Reminder: {lesson.reminder_sent ? "sent" : "not sent"}
            </span>
          </div>
        </div>
        <div className="button-row">
          <Link className="button-secondary" href="/calendar">
            Calendar
          </Link>
        </div>
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
          <ManualReminderActions lesson={lesson} timeZone={timeZone} />
          <DeleteLessonButton lessonId={lesson.id} />
        </div>
      </section>

      <section className="panel">
        <LessonForm
          mode="edit"
          lesson={lesson}
          timeZone={timeZone}
          instructorProfiles={instructorProfiles}
        />
      </section>
    </main>
  );
}
