"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type OAuthButtonsProps = {
  redirectTo: string;
  enabled: boolean;
};

type Provider = "github" | "google";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "github", label: "Continue with GitHub", hint: "Best default for developer-facing museums." },
  { id: "google", label: "Continue with Google", hint: "Useful if you want broader non-GitHub sign-in coverage." }
];

export function OAuthButtons({ redirectTo, enabled }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<Provider | null>(null);

  const handleSignIn = async (provider: Provider) => {
    const supabase = createSupabaseClient();

    if (!enabled || !supabase) {
      return;
    }

    setIsLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });

    if (error) {
      console.error(error);
      setIsLoading(null);
    }
  };

  return (
    <div className="stack">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className="primary-button auth-button"
          onClick={() => void handleSignIn(provider.id)}
          disabled={!enabled || isLoading !== null}
        >
          {isLoading === provider.id ? "Redirecting..." : provider.label}
          <span className="auth-hint">{provider.hint}</span>
        </button>
      ))}
      {!enabled ? (
        <p className="inline-note">
          OAuth is disabled until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.
        </p>
      ) : null}
    </div>
  );
}
