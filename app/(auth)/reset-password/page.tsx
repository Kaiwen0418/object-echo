import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export default function ResetPasswordPage() {
  return (
    <section className="shell auth-shell">
      <div className="section-eyebrow">Recovery</div>
      <h1>Reset password</h1>
      <p className="shell-copy">Set a new password after opening the recovery link from your inbox.</p>
      <PasswordResetForm />
    </section>
  );
}
