import { EmailSignupForm } from "@/components/auth/EmailSignupForm";
import { getAppUrl, getSupabaseEnv } from "@/lib/supabase/config";
import { getRequestOrigin } from "@/lib/supabase/request-origin";

export default async function SignupPage() {
  const env = getSupabaseEnv();
  const requestOrigin = await getRequestOrigin();

  return (
    <section className="shell auth-shell">
      <div className="section-eyebrow">Create account</div>
      <h1>Sign up</h1>
      <p className="shell-copy">Create an Object Echo account with email and password.</p>
      <EmailSignupForm redirectTo={getAppUrl("/login?confirmed=1", requestOrigin)} enabled={env.enabled} />
    </section>
  );
}
