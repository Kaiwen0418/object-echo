import { EmailSignupForm } from "@/components/auth/EmailSignupForm";
import { getAppUrl, getSupabaseEnv } from "@/lib/supabase/config";

export default function SignupPage() {
  const env = getSupabaseEnv();

  return (
    <section className="shell auth-shell">
      <div className="section-eyebrow">Create account</div>
      <h1>Sign up</h1>
      <p className="shell-copy">Create an Object Echo account with email and password.</p>
      <EmailSignupForm redirectTo={getAppUrl("/login?confirmed=1")} enabled={env.enabled} />
    </section>
  );
}
