"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthNoticeToast } from "@/components/auth/AuthNoticeToast";
import { createSupabaseClient } from "@/lib/supabase/client";

type EmailSignupFormProps = {
  redirectTo: string;
  enabled: boolean;
};

export function EmailSignupForm({ redirectTo, enabled }: EmailSignupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          display_name: displayName
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsPending(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccess("Confirmation request accepted. Check your inbox and spam folder. Delivery still depends on your Supabase email provider.");
    setIsPending(false);
  };

  return (
    <>
      {error ? <AuthNoticeToast tone="error" message={error} onDismiss={() => setError(null)} /> : null}
      {success ? <AuthNoticeToast tone="success" message={success} onDismiss={() => setSuccess(null)} /> : null}
      <form className="panel form-grid auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="section-eyebrow">Email sign up</div>
        <div>
          <label htmlFor="signup-name">Display name</label>
          <input
            id="signup-name"
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Kaiwen Liu"
          />
        </div>
        <div>
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        {success ? <p className="field-success">{success}</p> : null}
        <div className="inline-actions">
          <button type="submit" className="primary-button" disabled={!enabled || isPending}>
            {isPending ? "Creating..." : "Create Account"}
          </button>
          <Link className="nav-link" href="/login">
            Back to login
          </Link>
        </div>
      </form>
    </>
  );
}
