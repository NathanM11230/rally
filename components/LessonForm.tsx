"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getLessonFormDateTime } from "@/lib/date";
import type { InstructorProfile, LessonWithInstructorProfile } from "@/types/database";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      instructor_profile_id: String(formData.get("instructor_profile_id") ?? ""),
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
      currentStudents.length === 1
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

      <div className="form-grid">
        <label className="field field-full">
          Pro
          <select
            required
            name="instructor_profile_id"
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
        </label>

        <div className="field field-full">
          <div className="field-heading">
            <label>Students</label>
            <button className="button-secondary compact-button" type="button" onClick={addStudent}>
              Add student
            </button>
          </div>

          <div className="student-list">
            {students.map((student, index) => (
              <div className="student-row" key={student.id}>
                <div className="student-row-header">
                  <strong>Student {index + 1}</strong>
                  <button
                    className="button-danger compact-button"
                    type="button"
                    disabled={students.length === 1}
                    onClick={() => removeStudent(student.id)}
                  >
                    Remove
                  </button>
                </div>
                <Field
                  label="Name"
                  name={`student_name_${student.id}`}
                  value={student.student_name}
                  onChange={(value) => updateStudent(student.id, "student_name", value)}
                />
                <Field
                  label="Phone"
                  name={`student_phone_${student.id}`}
                  type="tel"
                  value={student.student_phone}
                  placeholder="+15551234567"
                  onChange={(value) => updateStudent(student.id, "student_phone", value)}
                />
              </div>
            ))}
          </div>
        </div>

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
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
};

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  value,
  placeholder,
  onChange,
}: FieldProps) {
  return (
    <label className="field">
      {label}
      <input
        required
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
      : [
          {
            student_name: lesson.student_name,
            student_phone: lesson.student_phone,
          },
        ];

  return students.map((student) => ({
    id: crypto.randomUUID(),
    student_name: student.student_name,
    student_phone: student.student_phone,
  }));
}
