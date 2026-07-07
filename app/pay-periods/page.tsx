import Link from "next/link";

import { PrintButton } from "@/components/PrintButton";
import { requireCurrentProfile } from "@/lib/auth";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getLessonInstructorNames } from "@/lib/lesson-instructors";
import { getLessonsForCalendar } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";
import {
  formatPayPeriodLabel,
  getCurrentPayPeriod,
  getPayPeriodFromStartDate,
  getPayPeriodQueryRange,
  shiftPayPeriod,
  type PayPeriod,
} from "@/lib/pay-periods";
import { getSessionLabel } from "@/lib/session-types";
import type { LessonWithInstructorProfile } from "@/types/database";

type PayPeriodsPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

type PayPeriodLessonGroup = {
  id: string;
  title: string;
  lessons: LessonWithInstructorProfile[];
};

export const dynamic = "force-dynamic";

export default async function PayPeriodsPage({ searchParams }: PayPeriodsPageProps) {
  const params = await searchParams;
  const { profile } = await requireCurrentProfile();
  const timeZone = getLessonTimeZone();
  const selectedPeriod = getPayPeriodFromStartDate(params.period, timeZone);
  const currentPeriod = getCurrentPayPeriod(timeZone);
  const previousPeriod = shiftPayPeriod(selectedPeriod, -1);
  const nextPeriod = shiftPayPeriod(selectedPeriod, 1);
  const { start, end } = getPayPeriodQueryRange(selectedPeriod, timeZone);

  let lessons: LessonWithInstructorProfile[] | null = null;

  try {
    lessons = await getLessonsForCalendar({
      start,
      end,
      instructorProfileId: profile.id,
    });
  } catch {
    lessons = null;
  }

  if (!lessons) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Pay periods</h1>
            <p className="lede">
              Add your Supabase environment variables before Rally can load pay
              period reports.
            </p>
          </div>
        </header>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header print-compact">
        <div>
          <h1>Pay period</h1>
          <p className="page-subtitle">
            {formatPayPeriodLabel(selectedPeriod)} - {profile.full_name}
          </p>
        </div>
        <div className="button-row print-hidden">
          <PrintButton />
          <Link className="button" href="/lessons/new">
            New lesson
          </Link>
        </div>
      </header>

      <section className="calendar-controls print-hidden">
        <div className="button-row">
          <Link
            className="button-secondary"
            href={buildPayPeriodHref(previousPeriod)}
          >
            Previous
          </Link>
          <Link
            className="button-secondary"
            href={buildPayPeriodHref(currentPeriod)}
          >
            Current
          </Link>
          <Link
            className="button-secondary"
            href={buildPayPeriodHref(nextPeriod)}
          >
            Next
          </Link>
        </div>
      </section>

      {lessons.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No lessons in this pay period.
          </div>
        </section>
      ) : (
        <>
          <div className="calendar-summary">
            <strong>{lessons.length}</strong>{" "}
            {lessons.length === 1 ? "lesson" : "lessons"} in this pay period.
          </div>

          {getPayPeriodLessonGroups(lessons).map((group) => (
            <section className="dash-section" key={group.id}>
              <h2 className="section-title">
                {group.title} - {group.lessons.length}{" "}
                {group.lessons.length === 1 ? "lesson" : "lessons"}
              </h2>
              <div className="lesson-cards">
                {group.lessons.map((lesson) => (
                  <PayPeriodLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    timeZone={timeZone}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}

function getPayPeriodLessonGroups(
  lessons: LessonWithInstructorProfile[],
): PayPeriodLessonGroup[] {
  const groups: PayPeriodLessonGroup[] = [
    {
      id: "varsity",
      title: "Varsity",
      lessons: lessons.filter((lesson) => lesson.session_type === "varsity"),
    },
    {
      id: "freshmen",
      title: "Freshmen",
      lessons: lessons.filter((lesson) => lesson.session_type === "freshmen"),
    },
    {
      id: "lessons",
      title: "Lessons",
      lessons: lessons.filter((lesson) => lesson.session_type === "lesson"),
    },
    {
      id: "other-events",
      title: "Other events",
      lessons: lessons.filter(
        (lesson) =>
          !["varsity", "freshmen", "lesson"].includes(lesson.session_type),
      ),
    },
  ];

  return groups.filter((group) => group.lessons.length > 0);
}

function PayPeriodLessonCard({
  lesson,
  timeZone,
}: {
  lesson: LessonWithInstructorProfile;
  timeZone: string;
}) {
  const students = getLessonStudents(lesson);
  const sessionLabel = getSessionLabel(lesson);
  const participantSummary =
    students.length > 0
      ? students.map((student) => student.student_name).join(", ")
      : sessionLabel;

  return (
    <div className="lesson-card pay-lesson-card">
      <div className="lesson-card-header">
        <div className="lesson-card-time">
          {formatLessonDateTime(lesson, timeZone)}
          <span className="lesson-card-location">{lesson.location}</span>
        </div>
      </div>
      <div className="lesson-card-body">
        <span className="lesson-card-students">{participantSummary}</span>
        <span className="lesson-card-pro">
          {students.length > 0 ? `${sessionLabel} - ` : ""}
          {getLessonInstructorNames(lesson)}
        </span>
      </div>
      {lesson.notes ? <p className="lesson-card-notes">{lesson.notes}</p> : null}
      <div className="lesson-card-actions">
        <Link
          className="button-secondary compact-button print-hidden"
          href={`/lessons/${lesson.id}/edit`}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

function buildPayPeriodHref(period: PayPeriod) {
  const params = new URLSearchParams({ period: period.startDateKey });

  return `/pay-periods?${params.toString()}`;
}
