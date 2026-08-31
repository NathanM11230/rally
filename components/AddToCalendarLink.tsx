import { buildLessonCalendarToken } from "@/lib/calendar-token";

type AddToCalendarLinkProps = {
  lessonId: string;
  instructorProfileId: string;
  calendarTokenVersion: number;
};

export function AddToCalendarLink({
  lessonId,
  instructorProfileId,
  calendarTokenVersion,
}: AddToCalendarLinkProps) {
  const token = buildLessonCalendarToken(
    lessonId,
    instructorProfileId,
    calendarTokenVersion,
  );
  const href = token
    ? `/api/lessons/${lessonId}/calendar?token=${encodeURIComponent(token)}`
    : `/api/lessons/${lessonId}/calendar`;

  return (
    <a
      className="button-secondary compact-button"
      href={href}
    >
      Add to calendar
    </a>
  );
}
