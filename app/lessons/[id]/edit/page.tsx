import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteLessonButton } from "@/components/DeleteLessonButton";
import { LessonForm } from "@/components/LessonForm";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getLesson } from "@/lib/lessons";

type EditLessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id } = await params;
  const timeZone = getLessonTimeZone();
  const lesson = await getLesson(id);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Edit lesson</p>
          <h1>{lesson.student_name}</h1>
          <div className="details-bar">
            <span className="detail-chip">{formatLessonDateTime(lesson, timeZone)}</span>
            <span className="detail-chip">{lesson.location}</span>
            <span className="detail-chip">
              Reminder: {lesson.reminder_sent ? "sent" : "not sent"}
            </span>
          </div>
        </div>
        <div className="button-row">
          <Link className="button-secondary" href="/">
            Dashboard
          </Link>
          <DeleteLessonButton lessonId={lesson.id} />
        </div>
      </header>

      <section className="panel">
        <LessonForm mode="edit" lesson={lesson} timeZone={timeZone} />
      </section>
    </main>
  );
}
