"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import type { InstructorProfile } from "@/types/database";

type ProfileFormProps = {
  profile: InstructorProfile | null;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/instructor-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Unable to save instructor profile.");
      }

      router.push("/");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-grid">
        <Field label="Instructor full name" name="full_name" defaultValue={profile?.full_name} />
        <Field
          label="Instructor phone number"
          name="phone_number"
          type="tel"
          defaultValue={profile?.phone_number}
          placeholder="+15557654321"
        />
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : profile ? "Save profile" : "Create profile"}
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
