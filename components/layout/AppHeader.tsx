import type { Route } from "next";
import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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
  const isMarketing = variant === "marketing";

  return (
    <header className={`site-header ${isMarketing ? "marketing-header" : "dashboard-header"}`}>
      {isMarketing ? (
        <>
          <div className="site-header-frame" aria-hidden="true">
            <span className="frame-mark frame-mark-tl" />
            <span className="frame-mark frame-mark-tr" />
            <span className="frame-mark frame-mark-bl" />
            <span className="frame-mark frame-mark-br" />
          </div>
          <div className="site-header-gridline" aria-hidden="true" />
          <div className="site-header-side telemetry-left">ARCHIVE MODE / WALKMAN FOCUS</div>
          <div className="site-header-side telemetry-right">SYS STATE / CURATION ONLINE</div>
        </>
      ) : null}
      <div className="site-brand-lockup">
        <Link className="site-brand" href={brandHref}>
          {isMarketing ? <span className="site-brand-mark" aria-hidden="true" /> : null}
          OBJECT ECHO
        </Link>
        {isMarketing ? <span className="site-brand-code">MK.IV // 2008-2025</span> : null}
      </div>
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
        {isMarketing ? <ThemeToggle /> : null}
        <AuthStatus compact />
      </div>
    </header>
  );
}
