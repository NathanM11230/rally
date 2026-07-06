import Link from "next/link";

import { LessonStatusSelect } from "@/components/LessonStatusSelect";
import { PrintButton } from "@/components/PrintButton";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import {
  getLessonStatus,
  getLessonStatusClass,
  LESSON_STATUSES,
  lessonStatusLabels,
} from "@/lib/lesson-status";
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
import type { InstructorProfile, LessonStatus, LessonWithInstructorProfile } from "@/types/database";

type PayPeriodsPageProps = {
  searchParams: Promise<{
    period?: string;
    pro?: string;
  }>;
};

type LessonGroup = {
  id: string;
  name: string;
  lessons: LessonWithInstructorProfile[];
};

export const dynamic = "force-dynamic";

export default async function PayPeriodsPage({ searchParams }: PayPeriodsPageProps) {
  const params = await searchParams;
  const timeZone = getLessonTimeZone();
  const selectedPeriod = getPayPeriodFromStartDate(params.period, timeZone);
  const currentPeriod = getCurrentPayPeriod(timeZone);
  const previousPeriod = shiftPayPeriod(selectedPeriod, -1);
  const nextPeriod = shiftPayPeriod(selectedPeriod, 1);
  const { start, end } = getPayPeriodQueryRange(selectedPeriod, timeZone);

  let lessons: LessonWithInstructorProfile[] | null = null;
  let profiles: InstructorProfile[] | null = null;
  let selectedProId = "";

  try {
    profiles = await getInstructorProfiles();
    selectedProId =
      params.pro && profiles.some((profile) => profile.id === params.pro) ? params.pro : "";
    lessons = await getLessonsForCalendar({
      start,
      end,
      instructorProfileId: selectedProId || undefined,
    });
  } catch {
    lessons = null;
    profiles = null;
  }

  if (!lessons || !profiles) {
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

  const selectedProfile = profiles.find((profile) => profile.id === selectedProId);
  const statusCounts = getStatusCounts(lessons);
  const groups = getLessonGroups(lessons, profiles, selectedProId);

  return (
    <main className="page">
      <header className="page-header print-compact">
        <div>
          <h1>Pay period</h1>
          <p className="page-subtitle">
            {formatPayPeriodLabel(selectedPeriod)}
            {selectedProfile ? ` - ${selectedProfile.full_name}` : " - All pros"}
          </p>
        </div>
        <div className="button-row print-hidden">
          <PrintButton />
          <Link className="button" href="/lessons/new">
            New session
          </Link>
        </div>
      </header>

      <section className="calendar-controls print-hidden">
        <div className="button-row">
          <Link
            className="button-secondary"
            href={buildPayPeriodHref(previousPeriod, selectedProId)}
          >
            Previous
          </Link>
          <Link
            className="button-secondary"
            href={buildPayPeriodHref(currentPeriod, selectedProId)}
          >
            Current
          </Link>
          <Link
            className="button-secondary"
            href={buildPayPeriodHref(nextPeriod, selectedProId)}
          >
            Next
          </Link>
        </div>

        {profiles.length > 0 ? (
          <div className="filter-row" aria-label="Pay period pro filters">
            <Link
              className={`filter-chip ${!selectedProId ? "filter-chip-active" : ""}`}
              href={buildPayPeriodHref(selectedPeriod, "")}
            >
              All pros
            </Link>
            {profiles.map((profile) => (
              <Link
                className={`filter-chip ${
                  selectedProId === profile.id ? "filter-chip-active" : ""
                }`}
                href={buildPayPeriodHref(selectedPeriod, profile.id)}
                key={profile.id}
              >
                {profile.full_name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="pay-summary" aria-label="Pay period status summary">
        <SummaryCard label="Completed" value={statusCounts.completed} />
        <SummaryCard label="Scheduled" value={statusCounts.scheduled} />
        <SummaryCard label="Cancelled" value={statusCounts.cancelled} />
        <SummaryCard label="No-show" value={statusCounts.no_show} />
      </section>

      {profiles.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            Add your club pros first, then Rally can build pay period reports.
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
            No lessons in this pay period.
          </div>
        </section>
      ) : (
        groups.map((group) => (
          <section className="dash-section" key={group.id}>
            <h2 className="section-title">
              {group.name} - {group.lessons.length}{" "}
              {group.lessons.length === 1 ? "lesson" : "lessons"}
            </h2>
            <div className="lesson-cards">
              {group.lessons.map((lesson) => (
                <PayPeriodLessonCard key={lesson.id} lesson={lesson} timeZone={timeZone} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}

function PayPeriodLessonCard({
  lesson,
  timeZone,
}: {
  lesson: LessonWithInstructorProfile;
  timeZone: string;
}) {
  const students = getLessonStudents(lesson);
  const status = getLessonStatus(lesson);
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
        <span className={`status-pill ${getLessonStatusClass(status)}`}>
          {lessonStatusLabels[status]}
        </span>
      </div>
      <div className="lesson-card-body">
        <span className="lesson-card-students">{participantSummary}</span>
        <span className="lesson-card-pro">
          {students.length > 0 ? `${sessionLabel} - ` : ""}
          {lesson.instructor_profile?.full_name ?? "No pro assigned"}
        </span>
      </div>
      {lesson.notes ? <p className="lesson-card-notes">{lesson.notes}</p> : null}
      <div className="lesson-card-actions">
        <LessonStatusSelect lessonId={lesson.id} status={status} />
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="pay-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getLessonGroups(
  lessons: LessonWithInstructorProfile[],
  profiles: InstructorProfile[],
  selectedProId: string,
): LessonGroup[] {
  if (selectedProId) {
    const profile = profiles.find((item) => item.id === selectedProId);

    return [
      {
        id: selectedProId,
        name: profile?.full_name ?? "Selected pro",
        lessons,
      },
    ];
  }

  const groups = profiles
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      lessons: lessons.filter((lesson) => lesson.instructor_profile_id === profile.id),
    }))
    .filter((group) => group.lessons.length > 0);
  const missingProfileLessons = lessons.filter((lesson) => !lesson.instructor_profile);

  if (missingProfileLessons.length > 0) {
    groups.push({
      id: "missing-profile",
      name: "Missing pro",
      lessons: missingProfileLessons,
    });
  }

  return groups;
}

function getStatusCounts(lessons: LessonWithInstructorProfile[]) {
  return LESSON_STATUSES.reduce<Record<LessonStatus, number>>(
    (counts, status) => ({
      ...counts,
      [status]: lessons.filter((lesson) => getLessonStatus(lesson) === status).length,
    }),
    {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
  );
}

function buildPayPeriodHref(period: PayPeriod, proId: string) {
  const params = new URLSearchParams({ period: period.startDateKey });

  if (proId) {
    params.set("pro", proId);
  }

  return `/pay-periods?${params.toString()}`;
}
