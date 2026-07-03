"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  buildInstructorReminderSms,
  buildStudentReminderSms,
} from "@/lib/manual-sms";
import type { LessonWithInstructorProfile } from "@/types/database";

type ManualReminderActionsProps = {
  lesson: LessonWithInstructorProfile;
  timeZone: string;
};

export function ManualReminderActions({ lesson, timeZone }: ManualReminderActionsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const studentSms = buildStudentReminderSms(lesson, timeZone);
  const instructorSms = buildInstructorReminderSms(lesson, timeZone);

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
      <a className="button-secondary" href={studentSms.href}>
        Text student
      </a>
      {instructorSms ? (
        <a className="button-secondary" href={instructorSms.href}>
          Text instructor
        </a>
      ) : null}
      {lesson.reminder_sent ? (
        <button
          className="button-secondary"
          type="button"
          disabled={isSaving}
          onClick={() => updateReminderStatus(false)}
        >
          Reset status
        </button>
      ) : (
        <button
          className="button"
          type="button"
          disabled={isSaving}
          onClick={() => updateReminderStatus(true)}
        >
          Mark sent
        </button>
      )}
    </div>
  );
}
