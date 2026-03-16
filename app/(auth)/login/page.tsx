import { redirect } from "next/navigation";
import Link from "next/link";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl, getSupabaseEnv } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string; confirmed?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";
  const env = getSupabaseEnv();
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  const errorMessage =
    params.error === "oauth_callback_failed"
      ? "OAuth callback failed. Check your provider callback URL and redirect allow list."
      : params.error === "supabase_not_configured"
        ? "Supabase environment variables are missing."
        : null;
  const successMessage =
    params.confirmed === "1"
      ? "Account confirmed. You can now sign in with email and password."
      : params.reset === "1"
        ? "Password updated. Sign in with your new password."
        : null;

  return (
    <section className="shell auth-shell">
      <div className="section-eyebrow">Authentication</div>
      <h1>Login</h1>
      <p className="shell-copy">
        Sign in with email and password, or continue with GitHub or Google.
      </p>
      {errorMessage ? <div className="panel auth-alert">{errorMessage}</div> : null}
      {successMessage ? <p className="field-success">{successMessage}</p> : null}
      <EmailLoginForm next={next} enabled={env.enabled} />
      <div className="panel auth-divider">
        <div className="section-eyebrow">OAuth</div>
        <p className="field-help">Use provider-based auth if you do not want to manage a password.</p>
        <OAuthButtons redirectTo={getAuthCallbackUrl(next)} enabled={env.enabled} />
      </div>
      <div className="inline-actions">
        <Link className="nav-link" href="/signup">
          Create account
        </Link>
        <Link className="nav-link" href="/forgot-password">
          Reset password
        </Link>
      </div>
      <p className="inline-note">Provider callback URL in Supabase should point to `/auth/callback` via your app URL.</p>
    </section>
  );
}
