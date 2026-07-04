import Link from "next/link";

import {
  dateAndTimeToUtc,
  formatDateKeyInTimeZone,
  formatLessonTime,
  getCurrentMonthKey,
  getLessonTimeZone,
} from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import { getLessonsForCalendar } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";
import type { LessonWithInstructorProfile } from "@/types/database";

type CalendarPageProps = {
  searchParams: Promise<{
    month?: string;
    pro?: string;
  }>;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const timeZone = getLessonTimeZone();
  const selectedMonth = getValidMonthKey(params.month, timeZone);
  const nextMonth = shiftMonth(selectedMonth, 1);
  const previousMonth = shiftMonth(selectedMonth, -1);
  const monthStart = dateAndTimeToUtc(`${selectedMonth}-01`, "00:00", timeZone);
  const monthEnd = dateAndTimeToUtc(`${nextMonth}-01`, "00:00", timeZone);
  const todayKey = formatDateKeyInTimeZone(new Date(), timeZone);

  let lessons: LessonWithInstructorProfile[] | null = null;
  let profiles = null;
  let selectedProId = "";

  try {
    profiles = await getInstructorProfiles();
    selectedProId =
      params.pro && profiles.some((profile) => profile.id === params.pro) ? params.pro : "";
    lessons = await getLessonsForCalendar({
      start: monthStart,
      end: monthEnd,
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
            <p className="eyebrow">Setup needed</p>
            <h1>Lesson calendar</h1>
            <p className="lede">
              Add your Supabase environment variables before Rally can load the
              calendar.
            </p>
          </div>
          <Link className="button-secondary" href="/">
            Dashboard
          </Link>
        </header>
      </main>
    );
  }

  const selectedProfile = profiles.find((profile) => profile.id === selectedProId);
  const calendarCells = buildCalendarCells(selectedMonth, todayKey);
  const lessonsByDate = groupLessonsByDate(lessons, timeZone);
  const monthLabel = formatMonthLabel(selectedMonth);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>{monthLabel}</h1>
          <p className="page-subtitle">
            {selectedProfile
              ? `${selectedProfile.full_name}\u2019s lessons`
              : "All club lessons"}
          </p>
        </div>
      </header>

      <section className="calendar-controls">
        <div className="button-row">
          <Link
            className="button-secondary"
            href={buildCalendarHref(previousMonth, selectedProId)}
          >
            Previous
          </Link>
          <Link className="button-secondary" href={buildCalendarHref(getCurrentMonthKey(timeZone), selectedProId)}>
            Today
          </Link>
          <Link className="button-secondary" href={buildCalendarHref(nextMonth, selectedProId)}>
            Next
          </Link>
        </div>

        {profiles.length > 0 ? (
          <div className="filter-row" aria-label="Calendar pro filters">
            <Link
              className={`filter-chip ${!selectedProId ? "filter-chip-active" : ""}`}
              href={buildCalendarHref(selectedMonth, "")}
            >
              All pros
            </Link>
            {profiles.map((profile) => (
              <Link
                className={`filter-chip ${
                  selectedProId === profile.id ? "filter-chip-active" : ""
                }`}
                href={buildCalendarHref(selectedMonth, profile.id)}
                key={profile.id}
              >
                {profile.full_name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {profiles.length > 0 ? (
        <div className="calendar-summary">
          <strong>{lessons.length}</strong>{" "}
          {lessons.length === 1 ? "lesson" : "lessons"} shown
          {selectedProfile ? ` for ${selectedProfile.full_name}` : " for all pros"}.
        </div>
      ) : null}

      {profiles.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            Add your club pros first, then Rally can show each pro&apos;s calendar.
            <div className="button-row section-actions">
              <Link className="button" href="/profile">
                Add club pros
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel calendar-panel">
          <div className="calendar-wrap">
            <div className="calendar-grid">
              {WEEKDAYS.map((weekday) => (
                <div className="calendar-weekday" key={weekday}>
                  {weekday}
                </div>
              ))}

              {calendarCells.map((cell) => {
                const dayLessons = lessonsByDate.get(cell.dateKey) ?? [];

                return (
                  <div
                    className={`calendar-day ${
                      cell.isCurrentMonth ? "" : "calendar-day-muted"
                    } ${cell.isToday ? "calendar-day-today" : ""}`}
                    key={cell.dateKey}
                  >
                    <div className="calendar-day-header">
                      <span>{cell.dayNumber}</span>
                      {dayLessons.length > 0 ? (
                        <span className="calendar-count">{dayLessons.length}</span>
                      ) : null}
                    </div>

                    <div className="calendar-lessons">
                      {dayLessons.map((lesson) => (
                        <Link
                          className="calendar-lesson"
                          href={`/lessons/${lesson.id}/edit`}
                          key={lesson.id}
                        >
                          <span className="calendar-lesson-time">
                            {formatLessonTime(lesson, timeZone)}
                          </span>
                          <span className="calendar-lesson-title">
                            {getStudentSummary(lesson)}
                          </span>
                          <span className="calendar-lesson-meta">
                            {lesson.instructor_profile?.full_name ?? "Missing pro"}
                          </span>
                          <span className="calendar-lesson-meta">{lesson.location}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function groupLessonsByDate(lessons: LessonWithInstructorProfile[], timeZone: string) {
  const groups = new Map<string, LessonWithInstructorProfile[]>();

  for (const lesson of lessons) {
    const dateKey = formatDateKeyInTimeZone(new Date(lesson.lesson_start_time), timeZone);
    const dayLessons = groups.get(dateKey) ?? [];
    dayLessons.push(lesson);
    groups.set(dateKey, dayLessons);
  }

  return groups;
}

function getStudentSummary(lesson: LessonWithInstructorProfile) {
  const students = getLessonStudents(lesson);
  const names = students.map((student) => student.student_name);

  if (names.length <= 2) {
    return names.join(", ");
  }

  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function buildCalendarCells(monthKey: string, todayKey: string) {
  const { year, monthIndex } = getMonthParts(monthKey);
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const startOffset = firstOfMonth.getUTCDay();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, monthIndex, 1 - startOffset + index));
    const dateKey = toUtcDateKey(date);

    return {
      dateKey,
      dayNumber: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === monthIndex,
      isToday: dateKey === todayKey,
    };
  });
}

function getValidMonthKey(monthKey: string | undefined, timeZone: string) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return getCurrentMonthKey(timeZone);
  }

  const { monthIndex } = getMonthParts(monthKey);

  return monthIndex >= 0 && monthIndex <= 11 ? monthKey : getCurrentMonthKey(timeZone);
}

function formatMonthLabel(monthKey: string) {
  const { year, monthIndex } = getMonthParts(monthKey);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function shiftMonth(monthKey: string, amount: number) {
  const { year, monthIndex } = getMonthParts(monthKey);
  const shifted = new Date(Date.UTC(year, monthIndex + amount, 1));

  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
}

function buildCalendarHref(monthKey: string, proId: string) {
  const params = new URLSearchParams({ month: monthKey });

  if (proId) {
    params.set("pro", proId);
  }

  return `/calendar?${params.toString()}`;
}

function getMonthParts(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return {
    year,
    monthIndex: month - 1,
  };
}

function toUtcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
