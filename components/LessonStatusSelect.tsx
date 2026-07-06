"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LESSON_STATUSES, lessonStatusLabels } from "@/lib/lesson-status";
import type { LessonStatus } from "@/types/database";

type LessonStatusSelectProps = {
  lessonId: string;
  status: LessonStatus;
};

export function LessonStatusSelect({ lessonId, status }: LessonStatusSelectProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(nextStatus: LessonStatus) {
    setCurrentStatus(nextStatus);
    setIsSaving(true);

    const response = await fetch(`/api/lessons/${lessonId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    setIsSaving(false);

    if (response.ok) {
      router.refresh();
      return;
    }

    setCurrentStatus(status);
    window.alert("Unable to update lesson status.");
  }

  return (
    <label className="status-select-label">
      <span>Status</span>
      <select
        className="status-select"
        value={currentStatus}
        disabled={isSaving}
        onChange={(event) => handleChange(event.target.value as LessonStatus)}
      >
        {LESSON_STATUSES.map((lessonStatus) => (
          <option key={lessonStatus} value={lessonStatus}>
            {lessonStatusLabels[lessonStatus]}
          </option>
        ))}
      </select>
    </label>
  );
}
