import Link from "next/link";
import { SignOutLink } from "@/components/auth/SignOutLink";
import { getCurrentSupabaseUser } from "@/lib/supabase/server";

export async function AuthStatus() {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return (
      <div className="auth-status">
        <div className="panel-meta">Signed out</div>
        <div className="auth-status-line">No active session</div>
        <div className="inline-actions">
          <Link className="nav-link" href="/login">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.name ??
    user.email ??
    "Signed-in user";

  return (
    <div className="auth-status">
      <div className="panel-meta">Signed in</div>
      <div className="auth-status-line">{displayName}</div>
      <div className="auth-status-subline">{user.email}</div>
      <div className="inline-actions">
        <Link className="nav-link" href="/dashboard">
          Dashboard
        </Link>
        <SignOutLink />
        <SignOutLink next="/login" label="Switch Account" />
      </div>
    </div>
  );
}
