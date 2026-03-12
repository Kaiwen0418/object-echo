import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { MarketingHome } from "@/components/marketing/MarketingHome";

export default async function MarketingPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
        <div className="site-header-stack">
          <nav className="site-nav">
            <Link className="nav-link" href="/how-it-works">
              How It Works
            </Link>
            <Link className="nav-link" href="/dashboard">
              Dashboard
            </Link>
          </nav>
          <AuthStatus />
        </div>
      </header>
      <MarketingHome />
    </main>
  );
}
