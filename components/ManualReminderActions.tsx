"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  buildInstructorReminderSmsTargets,
  buildStudentReminderSms,
  getLessonStudents,
} from "@/lib/manual-sms";
import type { LessonWithInstructorProfile } from "@/types/database";

type ManualReminderActionsProps = {
  lesson: LessonWithInstructorProfile;
  timeZone: string;
  currentInstructorProfileId: string;
};

export function ManualReminderActions({
  lesson,
  timeZone,
  currentInstructorProfileId,
}: ManualReminderActionsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const studentSmsTargets = getLessonStudents(lesson).map((student) =>
    buildStudentReminderSms(lesson, student, timeZone),
  );
  const instructorSmsTargets = buildInstructorReminderSmsTargets(lesson, timeZone, {
    excludeInstructorProfileId: currentInstructorProfileId,
  });
  const hasParticipantReminderTargets = studentSmsTargets.length > 0;

  async function updateReminderStatus(reminderSent: boolean) {
    setIsSaving(true);

    const response = await fetch(`/api/lessons/${lesson.id}/reminder-sent`, {
      method: reminderSent ? "POST" : "DELETE",
    });

    setIsSaving(false);

    if (response.ok) {
      router.refresh();
      return;
    }

    window.alert("Unable to update reminder status.");
  }

  return (
    <div className="lesson-actions">
      {studentSmsTargets.map((studentSms) => (
        <a
          className="button-secondary"
          href={studentSms.href}
          key={`${studentSms.href}-${studentSms.label}`}
        >
          {studentSms.label}
        </a>
      ))}
      {instructorSmsTargets.map((instructorSms) => (
        <a
          className="button-secondary"
          href={instructorSms.href}
          key={`${instructorSms.href}-${instructorSms.label}`}
        >
          {instructorSms.label}
        </a>
      ))}
      {hasParticipantReminderTargets ? (
        lesson.reminder_sent ? (
          <button
            className="button-secondary"
            type="button"
            disabled={isSaving}
            onClick={() => updateReminderStatus(false)}
          >
            {studentSmsTargets.length > 1 ? "Reset all" : "Reset status"}
          </button>
        ) : (
          <button
            className="button"
            type="button"
            disabled={isSaving}
            onClick={() => updateReminderStatus(true)}
          >
            {studentSmsTargets.length > 1 ? "Mark all sent" : "Mark sent"}
          </button>
        )
      ) : null}
    </div>
  );
}
