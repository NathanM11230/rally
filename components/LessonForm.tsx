"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getLessonFormDateTime } from "@/lib/date";
import { SESSION_TYPES, sessionTypeLabels } from "@/lib/session-types";
import type {
  InstructorProfile,
  LessonWithInstructorProfile,
  SessionType,
} from "@/types/database";

type StudentFormRow = {
  id: string;
  student_name: string;
  student_phone: string;
};

type LessonFormProps =
  | {
      mode: "create";
      timeZone: string;
      instructorProfiles: InstructorProfile[];
      lesson?: never;
    }
  | {
      mode: "edit";
      timeZone: string;
      instructorProfiles: InstructorProfile[];
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
  const [students, setStudents] = useState<StudentFormRow[]>(() =>
    getInitialStudents(lesson),
  );
  const [sessionType, setSessionType] = useState<SessionType>(
    lesson?.session_type ?? "lesson",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      instructor_profile_id: String(formData.get("instructor_profile_id") ?? ""),
      session_type: sessionType,
      event_title: String(formData.get("event_title") ?? ""),
      lesson_date: String(formData.get("lesson_date") ?? ""),
      lesson_time: String(formData.get("lesson_time") ?? ""),
      location: String(formData.get("location") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      students: students.map((student) => ({
        student_name: student.student_name,
        student_phone: student.student_phone,
      })),
    };
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

  function addStudent() {
    setStudents((currentStudents) => [
      ...currentStudents,
      { id: crypto.randomUUID(), student_name: "", student_phone: "" },
    ]);
  }

  function removeStudent(id: string) {
    setStudents((currentStudents) =>
      currentStudents.length === 1 && sessionType === "lesson"
        ? currentStudents
        : currentStudents.filter((student) => student.id !== id),
    );
  }

  function updateStudent(id: string, field: "student_name" | "student_phone", value: string) {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === id
          ? {
              ...student,
              [field]: value,
            }
          : student,
      ),
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-section">
        <h3 className="form-section-title">Session</h3>
        <div className="form-grid">
          <label className="field">
            Type
            <select
              required
              name="session_type"
              value={sessionType}
              onChange={(event) => setSessionType(event.target.value as SessionType)}
            >
              {SESSION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {sessionTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>

          {sessionType === "other_event" ? (
            <Field
              label="Other event"
              name="event_title"
              defaultValue={lesson?.event_title ?? ""}
              placeholder="Cardio Tennis"
            />
          ) : null}
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Pro</h3>
        <select
          required
          name="instructor_profile_id"
          aria-label="Select a pro"
          defaultValue={lesson?.instructor_profile_id ?? ""}
        >
          <option value="" disabled>
            Select a pro
          </option>
          {props.instructorProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <div className="field-heading">
          <h3 className="form-section-title">Students / participants</h3>
          <button className="button-secondary compact-button" type="button" onClick={addStudent}>
            Add participant
          </button>
        </div>
        <div className="student-list">
          {students.map((student, index) => (
            <div className="student-row" key={student.id}>
              <div className="student-row-header">
                <strong>
                  {sessionType === "lesson" ? "Student" : "Participant"} {index + 1}
                </strong>
                <button
                  className="button-danger compact-button"
                  type="button"
                  disabled={students.length === 1 && sessionType === "lesson"}
                  onClick={() => removeStudent(student.id)}
                >
                  Remove
                </button>
              </div>
              <Field
                label="Name"
                name={`student_name_${student.id}`}
                value={student.student_name}
                required={sessionType === "lesson"}
                onChange={(value) => updateStudent(student.id, "student_name", value)}
              />
              <Field
                label="Phone"
                name={`student_phone_${student.id}`}
                type="tel"
                value={student.student_phone}
                placeholder="+15551234567"
                required={sessionType === "lesson"}
                onChange={(value) => updateStudent(student.id, "student_phone", value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Session details</h3>
        <div className="form-grid">
          <Field
            label="Date"
            name="lesson_date"
            type="date"
            defaultValue={dateTimeDefaults.lesson_date}
          />
          <Field
            label="Time"
            name="lesson_time"
            type="time"
            defaultValue={dateTimeDefaults.lesson_time}
          />
          <Field
            label="Location"
            name="location"
            defaultValue={lesson?.location}
            placeholder="Court 3"
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Notes</h3>
        <textarea
          name="notes"
          aria-label="Session notes"
          defaultValue={lesson?.notes ?? ""}
          placeholder="Optional notes for the reminder or instructor prep."
        />
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : props.mode === "edit" ? "Save changes" : "Create session"}
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
  value?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
};

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  value,
  placeholder,
  required = true,
  onChange,
}: FieldProps) {
  return (
    <label className="field">
      {label}
      <input
        required={required}
        name={name}
        type={type}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        placeholder={placeholder}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </label>
  );
}

function getInitialStudents(lesson: LessonWithInstructorProfile | null): StudentFormRow[] {
  if (!lesson) {
    return [{ id: crypto.randomUUID(), student_name: "", student_phone: "" }];
  }

  const students =
    lesson.lesson_students.length > 0
      ? lesson.lesson_students
      : lesson.student_name && lesson.student_phone
        ? [
            {
              student_name: lesson.student_name,
              student_phone: lesson.student_phone,
            },
          ]
        : [];

  return students.map((student) => ({
    id: crypto.randomUUID(),
    student_name: student.student_name,
    student_phone: student.student_phone,
  }));
}
