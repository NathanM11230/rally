type AddToCalendarLinkProps = {
  lessonId: string;
};

export function AddToCalendarLink({ lessonId }: AddToCalendarLinkProps) {
  return (
    <a
      className="button-secondary compact-button"
      href={`/api/lessons/${lessonId}/calendar`}
    >
      Add to calendar
    </a>
  );
}
