import Link from "next/link";
import { redirect } from "next/navigation";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl, getSupabaseEnv } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
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

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
      </header>
      <section className="shell auth-shell">
        <div className="section-eyebrow">Supabase OAuth</div>
        <h1>Login</h1>
        <p className="shell-copy">
          Sign in with GitHub or Google. Apple is intentionally out of scope for this phase because the setup burden is higher.
        </p>
        {errorMessage ? <div className="panel auth-alert">{errorMessage}</div> : null}
        <OAuthButtons redirectTo={getAuthCallbackUrl(next)} enabled={env.enabled} />
        <p className="inline-note">
          Provider callback URL in Supabase should point to `/auth/callback` via your app URL.
        </p>
      </section>
    </main>
  );
}
