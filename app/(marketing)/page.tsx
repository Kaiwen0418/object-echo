import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { MarketingHome } from "@/components/marketing/MarketingHome";

export default async function MarketingPage() {
  return (
    <main className="site-shell">
      <header className="site-header marketing-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
        <div className="site-header-actions">
          <nav className="site-nav">
            <Link className="nav-link" href="/how-it-works">
              How It Works
            </Link>
            <Link className="primary-button" href="/dashboard/new">
              Create
            </Link>
          </nav>
          <AuthStatus compact />
        </div>
      </header>
      <MarketingHome />
    </main>
  );
}
