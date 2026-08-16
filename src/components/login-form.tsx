"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type LoginFormProps = {
  nextPath: string;
  configured: boolean;
};

export function LoginForm({ nextPath, configured }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState(configured ? "" : "Authentication is not configured in Vercel.");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Sign-in failed.");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Unable to reach the authentication service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={submit}>
      <label htmlFor="dashboard-password">Dashboard password</label>
      <div className="login-input-wrap">
        <Icon name="shield" />
        <input
          autoComplete="current-password"
          autoFocus
          disabled={!configured || submitting}
          id="dashboard-password"
          minLength={8}
          name="password"
          placeholder="Enter your private password"
          required
          type="password"
        />
      </div>
      <p aria-live="polite" className={`login-feedback ${error ? "is-error" : ""}`}>
        {error || "Your session will remain active for 12 hours."}
      </p>
      <button className="primary-button login-submit" disabled={!configured || submitting} type="submit">
        {submitting ? "Verifying…" : "Enter command centre"} <Icon name="arrow" />
      </button>
    </form>
  );
}
