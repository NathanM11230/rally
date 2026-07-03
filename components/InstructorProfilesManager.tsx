"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import type { InstructorProfile } from "@/types/database";

type InstructorProfilesManagerProps = {
  profiles: InstructorProfile[];
};

export function InstructorProfilesManager({ profiles }: InstructorProfilesManagerProps) {
  return (
    <div className="profile-manager">
      <section className="profile-section">
        <h2>Add a pro</h2>
        <InstructorProfileForm mode="create" />
      </section>

      {profiles.length > 0 ? (
        <section className="profile-section">
          <h2>Club pros</h2>
          <div className="profile-list">
            {profiles.map((profile) => (
              <InstructorProfileForm key={profile.id} mode="edit" profile={profile} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type InstructorProfileFormProps =
  | {
      mode: "create";
      profile?: never;
    }
  | {
      mode: "edit";
      profile: InstructorProfile;
    };

function InstructorProfileForm(props: InstructorProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = props.mode === "edit";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const endpoint = isEdit
      ? `/api/instructor-profile/${props.profile.id}`
      : "/api/instructor-profile";
    const method = isEdit ? "PATCH" : "POST";

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
        throw new Error(body?.error || "Unable to save instructor profile.");
      }

      if (!isEdit) {
        form.reset();
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={isEdit ? "profile-card" : "form"} onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-grid">
        <Field
          label="Pro full name"
          name="full_name"
          defaultValue={isEdit ? props.profile.full_name : ""}
        />
        <Field
          label="Pro phone number"
          name="phone_number"
          type="tel"
          defaultValue={isEdit ? props.profile.phone_number : ""}
          placeholder="+15557654321"
        />
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save pro" : "Add pro"}
        </button>
        {!isEdit ? (
          <Link className="button-secondary" href="/">
            Dashboard
          </Link>
        ) : null}
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
