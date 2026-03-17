"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type EmailLoginFormProps = {
  next: string;
  enabled: boolean;
};

export function EmailLoginForm({ next, enabled }: EmailLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const supabase = createSupabaseClient();
    if (!enabled || !supabase) {
      setError("Supabase auth is not configured.");
      return;
    }

    setIsPending(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      setIsPending(false);
      return;
    }

    router.push(next as Route);
    router.refresh();
  };

  return (
    <form className="panel form-grid auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="section-eyebrow">Email login</div>
      <div>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="inline-actions">
        <button type="submit" className="primary-button" disabled={!enabled || isPending}>
          {isPending ? "Signing in..." : "Sign In"}
        </button>
        <Link className="nav-link" href="/forgot-password">
          Forgot password
        </Link>
        <Link className="nav-link" href="/signup">
          Create account
        </Link>
      </div>
    </form>
  );
}
