import type { Route } from "next";
import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";

type HeaderLink = {
  href: Route;
  label: string;
  tone?: "default" | "primary";
};

type AppHeaderProps = {
  brandHref?: Route;
  links?: HeaderLink[];
  variant?: "marketing" | "dashboard";
};

export async function AppHeader({
  brandHref = "/dashboard",
  links = [],
  variant = "dashboard"
}: AppHeaderProps) {
  return (
    <header className={`site-header ${variant === "marketing" ? "marketing-header" : "dashboard-header"}`}>
      <Link className="site-brand" href={brandHref}>
        OBJECT ECHO
      </Link>
      <div className="site-header-actions">
        <nav className="site-nav">
          {links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              className={link.tone === "primary" ? "primary-button" : "nav-link"}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <AuthStatus compact />
      </div>
    </header>
  );
}
