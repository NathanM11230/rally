"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  parseInviteFragment,
  type InviteCredentials,
} from "@/lib/invite-fragment";

export function AcceptInviteForm() {
  const router = useRouter();
  const credentials = useRef<InviteCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const result = parseInviteFragment(window.location.hash);
    let isCancelled = false;

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      if (!result.ok) {
        setError(result.error);
        return;
      }

      credentials.current = result.credentials;
      setIsReady(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const inviteCredentials = credentials.current;

    if (!inviteCredentials) {
      setError("This invitation is no longer available. Request a new invitation.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: inviteCredentials.accessToken,
          refresh_token: inviteCredentials.refreshToken,
          password,
        }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to finish setting up your account.");
      }

      credentials.current = null;
      router.replace("/");
      router.refresh();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to finish setting up your account.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form auth-form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <label className="field">
        Password
        <input
          required
          autoComplete="new-password"
          disabled={!isReady}
          minLength={10}
          name="password"
          type="password"
        />
      </label>
      <label className="field">
        Confirm password
        <input
          required
          autoComplete="new-password"
          disabled={!isReady}
          minLength={10}
          name="confirm_password"
          type="password"
        />
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={!isReady || isSaving}>
          {isSaving ? "Saving..." : "Finish account setup"}
        </button>
        <Link className="button-secondary" href="/login">
          Back to login
        </Link>
      </div>
    </form>
  );
}
