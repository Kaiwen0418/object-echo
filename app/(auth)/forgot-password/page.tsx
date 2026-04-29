import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";
import { getAppUrl, getSupabaseEnv } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  const env = getSupabaseEnv();

  return (
    <section className="shell auth-shell">
      <div className="section-eyebrow">Recovery</div>
      <h1>Forgot password</h1>
      <p className="shell-copy">Send a password reset link to your email address.</p>
      <PasswordResetRequestForm redirectTo={getAppUrl("/reset-password")} enabled={env.enabled} />
    </section>
  );
}
