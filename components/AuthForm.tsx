"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormProps =
  | {
      mode: "login";
    }
  | {
      mode: "signup";
    };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      full_name: String(formData.get("full_name") ?? ""),
      phone_number: String(formData.get("phone_number") ?? ""),
      invite_code: String(formData.get("invite_code") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to continue.");
      }

      if (body?.needsEmailConfirmation) {
        setMessage("Account created. Check your email to confirm it, then log in.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to continue.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form auth-form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}
      {message ? <div className="form-success">{message}</div> : null}

      {isSignup ? (
        <div className="form-grid">
          <Field label="Full name" name="full_name" />
          <Field label="Phone number" name="phone_number" type="tel" />
          <Field label="Invite code" name="invite_code" required={false} />
        </div>
      ) : null}

      <Field label="Email" name="email" type="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        minLength={isSignup ? 10 : undefined}
      />

      <div className="form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {isSaving ? "Working..." : isSignup ? "Create account" : "Log in"}
        </button>
        {isSignup ? (
          <Link className="button-secondary" href="/login">
            Log in instead
          </Link>
        ) : (
          <Link className="button-secondary" href="/signup">
            Create account
          </Link>
        )}
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  minLength?: number;
  required?: boolean;
};

function Field({
  label,
  name,
  type = "text",
  minLength,
  required = true,
}: FieldProps) {
  return (
    <label className="field">
      {label}
      <input required={required} name={name} type={type} minLength={minLength} />
    </label>
  );
}
