import Image from "next/image";
import Link from "next/link";
import { SignOutLink } from "@/components/auth/SignOutLink";
import { getCurrentSupabaseUser } from "@/lib/supabase/server";

type AuthStatusProps = {
  compact?: boolean;
};

export async function AuthStatus({ compact = false }: AuthStatusProps) {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return (
      <div className={`auth-status ${compact ? "compact" : ""}`}>
        {compact ? <div className="auth-status-guest">Guest</div> : <div className="panel-meta">Signed out</div>}
        {!compact ? <div className="auth-status-line">No active session</div> : null}
        <div className={`inline-actions ${compact ? "compact-auth-actions" : ""}`}>
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
  const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

  if (compact) {
    return (
      <div className="auth-status compact auth-status-menu">
        <Link className="auth-status-trigger" href="/dashboard" aria-label="Open dashboard">
          <span className="auth-avatar" aria-hidden="true">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="36px" />
            ) : (
              <span>{displayName.slice(0, 1).toUpperCase()}</span>
            )}
          </span>
          <span className="auth-status-line auth-status-name">{displayName}</span>
        </Link>
        <div className="auth-status-dropdown">
          <Link className="nav-link" href="/dashboard">
            Dashboard
          </Link>
          <SignOutLink next="/login" label="Switch Account" />
          <SignOutLink />
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-status ${compact ? "compact" : ""}`}>
      <div className="panel-meta">Signed in</div>
      <div className="auth-status-line">{displayName}</div>
      {!compact ? <div className="auth-status-subline">{user.email}</div> : null}
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
