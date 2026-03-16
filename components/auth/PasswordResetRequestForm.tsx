"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthNoticeToast } from "@/components/auth/AuthNoticeToast";
import { createSupabaseClient } from "@/lib/supabase/client";

type PasswordResetRequestFormProps = {
  redirectTo: string;
  enabled: boolean;
};

export function PasswordResetRequestForm({ redirectTo, enabled }: PasswordResetRequestFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const supabase = createSupabaseClient();
    if (!enabled || !supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    setIsPending(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (resetError) {
      setError(resetError.message);
      setIsPending(false);
      return;
    }

    setSuccess("Reset request accepted. Check your inbox and spam folder. Delivery still depends on your Supabase email provider.");
    setIsPending(false);
  };

  return (
    <>
      {error ? <AuthNoticeToast tone="error" message={error} onDismiss={() => setError(null)} /> : null}
      {success ? <AuthNoticeToast tone="success" message={success} onDismiss={() => setSuccess(null)} /> : null}
      <form className="panel form-grid auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="section-eyebrow">Password recovery</div>
        <div>
          <label htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        {success ? <p className="field-success">{success}</p> : null}
        <div className="inline-actions">
          <button type="submit" className="primary-button" disabled={!enabled || isPending}>
            {isPending ? "Sending..." : "Send Reset Link"}
          </button>
          <Link className="nav-link" href="/login">
            Back to login
          </Link>
        </div>
      </form>
    </>
  );
}
