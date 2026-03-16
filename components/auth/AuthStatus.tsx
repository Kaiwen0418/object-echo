import Image from "next/image";
import Link from "next/link";
import { SignOutLink } from "@/components/auth/SignOutLink";
import { createSupabaseServerClient, getCurrentSupabaseUser } from "@/lib/supabase/server";

type AuthStatusProps = {
  compact?: boolean;
};

export async function AuthStatus({ compact = false }: AuthStatusProps) {
  const user = await getCurrentSupabaseUser();
  const supabase = await createSupabaseServerClient();

  if (!user) {
    return (
      <div className={`auth-status ${compact ? "compact" : ""}`}>
        {compact ? <div className="auth-status-guest">Guest</div> : <div className="panel-meta">Signed out</div>}
        {!compact ? <div className="auth-status-line">No active session</div> : null}
        <div className={`inline-actions ${compact ? "compact-auth-actions" : ""}`}>
          <Link className="nav-link" href="/login">
            Login
          </Link>
          {!compact ? (
            <Link className="nav-link" href="/signup">
              Sign up
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const { data: profile } =
    supabase && user.id
      ? await supabase
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle<{ display_name: string | null; avatar_url: string | null }>()
      : { data: null };

  const emailLocalPart = user.email?.split("@")[0];
  const displayName =
    profile?.display_name?.trim() ??
    user.user_metadata?.display_name ??
    user.user_metadata?.name ??
    emailLocalPart ??
    user.id ??
    "Signed-in user";
  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

  if (compact) {
    return (
      <div className="auth-status compact auth-status-menu">
        <Link className="auth-status-trigger" href="/dashboard" aria-label="Open dashboard">
          <span className={`auth-avatar${avatarUrl ? "" : " auth-avatar-fallback"}`} aria-hidden="true">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="36px" />
            ) : null}
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
