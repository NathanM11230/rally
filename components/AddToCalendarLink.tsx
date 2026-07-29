import { buildLessonCalendarToken } from "@/lib/calendar-token";

type AddToCalendarLinkProps = {
  lessonId: string;
  instructorProfileId: string;
};

export function AddToCalendarLink({
  lessonId,
  instructorProfileId,
}: AddToCalendarLinkProps) {
  const token = buildLessonCalendarToken(lessonId, instructorProfileId);
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
