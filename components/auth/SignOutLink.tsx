type SignOutLinkProps = {
  next?: string;
  label?: string;
};

export function SignOutLink({ next, label = "Sign Out" }: SignOutLinkProps) {
  const href = next ? `/auth/signout?next=${encodeURIComponent(next)}` : "/auth/signout";

  return (
    <a className="nav-link" href={href}>
      {label}
    </a>
  );
}
