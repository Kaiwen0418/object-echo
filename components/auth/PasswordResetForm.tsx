"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export function PasswordResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [hasRecoveryContext, setHasRecoveryContext] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) return;

    const hasHashTokens = window.location.hash.includes("access_token");
    if (hasHashTokens) {
      setHasRecoveryContext(true);
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHasRecoveryContext(true);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoveryContext(true);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    setIsPending(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setError(updateError.message);
      setIsPending(false);
      return;
    }

    setSuccess("Password updated. Redirecting to login...");
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 900);
  };

  return (
    <form className="panel form-grid auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="section-eyebrow">Set new password</div>
      {!hasRecoveryContext ? (
        <p className="field-help">
          Open this page from the password recovery email so Supabase can establish a recovery session.
        </p>
      ) : null}
      <div>
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {success ? <p className="field-success">{success}</p> : null}
      <div className="inline-actions">
        <button type="submit" className="primary-button" disabled={isPending || !hasRecoveryContext}>
          {isPending ? "Updating..." : "Update Password"}
        </button>
        <Link className="nav-link" href="/login">
          Back to login
        </Link>
      </div>
    </form>
  );
}
