"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getLessonFormDateTime } from "@/lib/date";
import type { LessonWithInstructorProfile } from "@/types/database";

type LessonFormProps =
  | {
      mode: "create";
      timeZone: string;
      lesson?: never;
    }
  | {
      mode: "edit";
      timeZone: string;
      lesson: LessonWithInstructorProfile;
    };

export function LessonForm(props: LessonFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lesson = props.mode === "edit" ? props.lesson : null;
  const dateTimeDefaults = lesson
    ? getLessonFormDateTime(lesson, props.timeZone)
    : { lesson_date: "", lesson_time: "" };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    let endpoint = "/api/lessons";
    let method = "POST";

    if (props.mode === "edit") {
      endpoint = `/api/lessons/${props.lesson.id}`;
      method = "PATCH";
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body?.errors?.join(" ") ||
          body?.error ||
          "Something went wrong while saving the lesson.";
        throw new Error(message);
      }

      router.push("/");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save lesson.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-grid">
        <Field label="Student name" name="student_name" defaultValue={lesson?.student_name} />
        <Field
          label="Student phone number"
          name="student_phone"
          type="tel"
          defaultValue={lesson?.student_phone}
          placeholder="+15551234567"
        />
        <Field
          label="Lesson date"
          name="lesson_date"
          type="date"
          defaultValue={dateTimeDefaults.lesson_date}
        />
        <Field
          label="Lesson time"
          name="lesson_time"
          type="time"
          defaultValue={dateTimeDefaults.lesson_time}
        />
        <Field
          label="Location or court"
          name="location"
          defaultValue={lesson?.location}
          placeholder="Court 3"
        />
        <label className="field field-full">
          Optional notes
          <textarea
            name="notes"
            defaultValue={lesson?.notes ?? ""}
            placeholder="Anything useful for the lesson reminder or instructor prep."
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : props.mode === "edit" ? "Save changes" : "Create lesson"}
        </button>
        <Link className="button-secondary" href="/">
          Cancel
        </Link>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
};

function Field({ label, name, type = "text", defaultValue = "", placeholder }: FieldProps) {
  return (
    <label className="field">
      {label}
      <input
        required
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}
