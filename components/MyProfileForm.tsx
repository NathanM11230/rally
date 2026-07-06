"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import type { InstructorProfile } from "@/types/database";

type MyProfileFormProps = {
  profile: InstructorProfile | null;
};

export function MyProfileForm({ profile }: MyProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      full_name: String(formData.get("full_name") ?? ""),
      phone_number: String(formData.get("phone_number") ?? ""),
    };
    const endpoint = profile
      ? `/api/instructor-profile/${profile.id}`
      : "/api/instructor-profile";
    const method = profile ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to save profile.");
      }

      setMessage("Profile saved.");
      router.refresh();

      if (!profile) {
        router.push("/");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}
      {message ? <div className="form-success">{message}</div> : null}

      <div className="form-grid">
        <label className="field">
          Full name
          <input
            required
            name="full_name"
            type="text"
            defaultValue={profile?.full_name ?? ""}
            placeholder="Nathan Smith"
          />
        </label>
        <label className="field">
          Phone number
          <input
            required
            name="phone_number"
            type="tel"
            defaultValue={profile?.phone_number ?? ""}
            placeholder="+15551234567"
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : profile ? "Save profile" : "Create profile"}
        </button>
      </div>
    </form>
  );
}
