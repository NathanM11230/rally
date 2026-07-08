"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { getLessonFormDateTime } from "@/lib/date";
import { SESSION_TYPES, sessionTypeLabels } from "@/lib/session-types";
import type {
  Contact,
  InstructorProfile,
  LessonWithInstructorProfile,
  SessionType,
} from "@/types/database";

type StudentFormRow = {
  id: string;
  student_name: string;
  student_phone: string;
};

type CourtFormRow = {
  id: string;
  value: string;
};

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const labelHour = hour % 12 || 12;
  const suffix = hour < 12 ? "AM" : "PM";

  return {
    value,
    label: `${labelHour}:${String(minute).padStart(2, "0")} ${suffix}`,
  };
});

type LessonFormProps =
  | {
      mode: "create";
      timeZone: string;
      instructorProfiles: InstructorProfile[];
      contacts: Contact[];
      defaultInstructorProfileId?: string;
      lesson?: never;
    }
  | {
      mode: "edit";
      timeZone: string;
      instructorProfiles: InstructorProfile[];
      contacts: Contact[];
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
  const [courts, setCourts] = useState<CourtFormRow[]>(() =>
    getInitialCourts(lesson),
  );
  const [sessionType, setSessionType] = useState<SessionType>(
    lesson?.session_type ?? "lesson",
  );
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>(() =>
    getInitialInstructorIds(
      lesson,
      props.mode === "create" ? props.defaultInstructorProfileId : undefined,
    ),
  );
  const savedContacts = sortContactsForQuery(props.contacts, "");
  const [activeContactRowId, setActiveContactRowId] = useState<string | null>(null);
  const [contactSuggestions, setContactSuggestions] = useState<
    Record<string, Contact[]>
  >({});
  const contactSearchId = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    if (selectedInstructorIds.length === 0) {
      setError("Select at least one pro.");
      setIsSaving(false);
      return;
    }

    const location = buildLocationFromCourts(courts);

    if (!location) {
      setError("Add at least one court or location.");
      setIsSaving(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      instructor_profile_id: selectedInstructorIds[0] ?? "",
      instructor_profile_ids: selectedInstructorIds,
      session_type: sessionType,
      event_title: String(formData.get("event_title") ?? ""),
      lesson_date: String(formData.get("lesson_date") ?? ""),
      lesson_time: String(formData.get("lesson_time") ?? ""),
      location,
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

  function addCourt() {
    setCourts((currentCourts) => [
      ...currentCourts,
      { id: crypto.randomUUID(), value: "" },
    ]);
  }

  function removeCourt(id: string) {
    setCourts((currentCourts) =>
      currentCourts.length === 1
        ? currentCourts
        : currentCourts.filter((court) => court.id !== id),
    );
  }

  function updateCourt(id: string, value: string) {
    setCourts((currentCourts) =>
      currentCourts.map((court) =>
        court.id === id
          ? {
              ...court,
              value,
            }
          : court,
      ),
    );
  }

  function toggleInstructor(instructorProfileId: string) {
    setSelectedInstructorIds((currentIds) =>
      currentIds.includes(instructorProfileId)
        ? currentIds.filter((id) => id !== instructorProfileId)
        : [...currentIds, instructorProfileId],
    );
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

  async function handleStudentNameChange(id: string, value: string) {
    updateStudent(id, "student_name", value);
    setActiveContactRowId(id);
    await searchContactsForStudent(id, value);
  }

  async function handleStudentNameFocus(id: string, value: string) {
    setActiveContactRowId(id);
    await searchContactsForStudent(id, value);
  }

  async function searchContactsForStudent(id: string, value: string) {
    const query = value.trim();

    if (query.length < 2) {
      setContactSuggestions((currentSuggestions) => ({
        ...currentSuggestions,
        [id]: [],
      }));
      return;
    }

    const localContacts = getMatchingContacts(savedContacts, query);
    const exactLocalMatches = localContacts.filter(
      (contact) => normalizeContactName(contact.full_name) === normalizeContactName(query),
    );

    if (exactLocalMatches.length === 1) {
      applyContact(id, exactLocalMatches[0]);
      return;
    }

    setContactSuggestions((currentSuggestions) => ({
      ...currentSuggestions,
      [id]: localContacts,
    }));

    const currentSearchId = contactSearchId.current + 1;
    contactSearchId.current = currentSearchId;

    try {
      const response = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);

      if (!response.ok || currentSearchId !== contactSearchId.current) {
        return;
      }

      const body = (await response.json()) as { contacts?: Contact[] };
      const contacts = sortContactsForQuery(
        mergeContactsByPhone([...localContacts, ...(body.contacts ?? [])]),
        query,
      );
      const exactMatches = contacts.filter(
        (contact) => normalizeContactName(contact.full_name) === normalizeContactName(query),
      );

      if (exactMatches.length === 1) {
        applyContact(id, exactMatches[0]);
        return;
      }

      setContactSuggestions((currentSuggestions) => ({
        ...currentSuggestions,
        [id]: contacts,
      }));
    } catch {
      // Keep the local directory matches visible if the live search is unavailable.
    }
  }

  function applyContact(id: string, contact: Contact) {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === id
          ? {
              ...student,
              student_name: contact.full_name,
              student_phone: contact.phone_number,
            }
          : student,
      ),
    );
    setContactSuggestions((currentSuggestions) => ({
      ...currentSuggestions,
      [id]: [],
    }));
    setActiveContactRowId(null);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-section">
        <h3 className="form-section-title">Lesson</h3>
        <div className="choice-grid session-type-grid">
          {SESSION_TYPES.map((type) => (
            <button
              className={`choice-button ${
                sessionType === type ? "choice-button-active" : ""
              }`}
              key={type}
              type="button"
              onClick={() => setSessionType(type)}
            >
              {sessionTypeLabels[type]}
            </button>
          ))}
        </div>

        {sessionType === "other_event" ? (
          <Field
            label="Other event"
            name="event_title"
            defaultValue={lesson?.event_title ?? ""}
            placeholder="Cardio Tennis"
          />
        ) : null}
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Pros</h3>
        <div className="choice-grid">
          {props.instructorProfiles.map((profile) => (
            <button
              className={`choice-button choice-button-stacked ${
                selectedInstructorIds.includes(profile.id) ? "choice-button-active" : ""
              }`}
              key={profile.id}
              type="button"
              onClick={() => toggleInstructor(profile.id)}
            >
              <span>{profile.full_name}</span>
              <small>{profile.phone_number}</small>
            </button>
          ))}
        </div>
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
              {savedContacts.length > 0 ? (
                <SavedContactSelect
                  contacts={savedContacts}
                  onSelectContact={(contact) => applyContact(student.id, contact)}
                />
              ) : null}
              <ContactNameField
                label="Name"
                name={`student_name_${student.id}`}
                value={student.student_name}
                required={sessionType === "lesson"}
                suggestions={contactSuggestions[student.id] ?? []}
                showSuggestions={activeContactRowId === student.id}
                onChange={(value) => handleStudentNameChange(student.id, value)}
                onFocus={() => handleStudentNameFocus(student.id, student.student_name)}
                onSelectContact={(contact) => applyContact(student.id, contact)}
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
        <h3 className="form-section-title">Lesson details</h3>
        <div className="form-grid">
          <Field
            label="Date"
            name="lesson_date"
            type="date"
            defaultValue={dateTimeDefaults.lesson_date}
          />
          <TimeField
            label="Time"
            name="lesson_time"
            defaultValue={dateTimeDefaults.lesson_time}
          />
        </div>
        <div className="field-heading">
          <span className="form-section-title">Courts / location</span>
          <button className="button-secondary compact-button" type="button" onClick={addCourt}>
            Add court
          </button>
        </div>
        <div className="court-list">
          {courts.map((court, index) => (
            <div className="court-row" key={court.id}>
              <Field
                label={`Court ${index + 1}`}
                name={`court_${court.id}`}
                value={court.value}
                placeholder="Court 3"
                onChange={(value) => updateCourt(court.id, value)}
              />
              <button
                className="button-danger compact-button"
                type="button"
                disabled={courts.length === 1}
                onClick={() => removeCourt(court.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Notes</h3>
        <textarea
          name="notes"
          aria-label="Lesson notes"
          defaultValue={lesson?.notes ?? ""}
          placeholder="Optional notes for the reminder or instructor prep."
        />
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
  required?: boolean;
  onChange?: (value: string) => void;
};

type TimeFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
};

type ContactNameFieldProps = {
  label: string;
  name: string;
  value: string;
  required: boolean;
  suggestions: Contact[];
  showSuggestions: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSelectContact: (contact: Contact) => void;
};

type SavedContactSelectProps = {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
};

function SavedContactSelect({ contacts, onSelectContact }: SavedContactSelectProps) {
  return (
    <label className="field saved-contact-picker">
      Saved contact
      <select
        defaultValue=""
        onChange={(event) => {
          const contact = contacts.find(
            (savedContact) => savedContact.id === event.currentTarget.value,
          );

          if (contact) {
            onSelectContact(contact);
          }

          event.currentTarget.value = "";
        }}
      >
        <option value="">Choose saved contact</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.full_name} - {contact.phone_number}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContactNameField({
  label,
  name,
  value,
  required,
  suggestions,
  showSuggestions,
  onChange,
  onFocus,
  onSelectContact,
}: ContactNameFieldProps) {
  return (
    <div className="contact-field">
      <label className="field">
        {label}
        <input
          required={required}
          name={name}
          type="text"
          value={value}
          autoComplete="off"
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>

      {showSuggestions && suggestions.length > 0 ? (
        <div className="contact-suggestions">
          {suggestions.map((contact) => (
            <button
              className="contact-suggestion"
              key={contact.id}
              type="button"
              aria-label={`Use ${contact.full_name}`}
              onPointerDown={(event) => {
                event.preventDefault();
                onSelectContact(contact);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectContact(contact);
                }
              }}
            >
              <span>{contact.full_name}</span>
              <small>{contact.phone_number}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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

function TimeField({ label, name, defaultValue = "" }: TimeFieldProps) {
  const safeDefaultValue = TIME_OPTIONS.some((option) => option.value === defaultValue)
    ? defaultValue
    : "";

  return (
    <label className="field">
      {label}
      <select required name={name} defaultValue={safeDefaultValue}>
        <option value="" disabled>
          Select time
        </option>
        {TIME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function getInitialCourts(lesson: LessonWithInstructorProfile | null): CourtFormRow[] {
  if (!lesson?.location) {
    return [{ id: crypto.randomUUID(), value: "" }];
  }

  const courts = lesson.location
    .split(",")
    .map((court) => court.trim())
    .filter(Boolean);

  if (courts.length === 0) {
    return [{ id: crypto.randomUUID(), value: "" }];
  }

  return courts.map((court) => ({
    id: crypto.randomUUID(),
    value: court,
  }));
}

function buildLocationFromCourts(courts: CourtFormRow[]) {
  return courts
    .map((court) => court.value.trim())
    .filter(Boolean)
    .join(", ");
}

function normalizeContactName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getMatchingContacts(contacts: Contact[], query: string) {
  const normalizedQuery = normalizeContactName(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return sortContactsForQuery(
    contacts.filter((contact) => {
      const normalizedName = normalizeContactName(contact.full_name);
      const normalizedPhone = contact.phone_number.replace(/\D/g, "");
      const normalizedQueryPhone = query.replace(/\D/g, "");

      return (
        normalizedName.includes(normalizedQuery) ||
        (normalizedQueryPhone.length > 0 && normalizedPhone.includes(normalizedQueryPhone))
      );
    }),
    query,
  ).slice(0, 8);
}

function sortContactsForQuery(contacts: Contact[], query: string) {
  const normalizedQuery = normalizeContactName(query);

  return [...contacts].sort((first, second) => {
    const firstScore = getContactMatchScore(first, normalizedQuery);
    const secondScore = getContactMatchScore(second, normalizedQuery);

    if (firstScore !== secondScore) {
      return firstScore - secondScore;
    }

    return first.full_name.localeCompare(second.full_name);
  });
}

function mergeContactsByPhone(contacts: Contact[]) {
  const contactsByPhone = new Map<string, Contact>();

  for (const contact of contacts) {
    const phoneKey = contact.normalized_phone || contact.phone_number.replace(/\D/g, "");

    if (!phoneKey || contactsByPhone.has(phoneKey)) {
      continue;
    }

    contactsByPhone.set(phoneKey, contact);
  }

  return Array.from(contactsByPhone.values());
}

function getContactMatchScore(contact: Contact, normalizedQuery: string) {
  const normalizedName = normalizeContactName(contact.full_name);

  if (normalizedName === normalizedQuery) {
    return 0;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedName.split(" ").some((namePart) => namePart.startsWith(normalizedQuery))) {
    return 2;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 3;
  }

  return 4;
}

function getInitialInstructorIds(
  lesson: LessonWithInstructorProfile | null,
  defaultInstructorProfileId?: string,
) {
  if (!lesson) {
    return defaultInstructorProfileId ? [defaultInstructorProfileId] : [];
  }

  const instructorIds =
    lesson.lesson_instructors.length > 0
      ? lesson.lesson_instructors.map((instructor) => instructor.instructor_profile_id)
      : [lesson.instructor_profile_id];

  return Array.from(new Set(instructorIds.filter(Boolean)));
}
