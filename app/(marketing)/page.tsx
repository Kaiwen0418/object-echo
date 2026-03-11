import Link from "next/link";
import { MarketingHome } from "@/components/marketing/MarketingHome";

export default function MarketingPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
        <nav className="site-nav">
          <Link className="nav-link" href="/how-it-works">
            How It Works
          </Link>
          <Link className="nav-link" href="/dashboard">
            Dashboard
          </Link>
          <Link className="nav-link" href="/login">
            Login
          </Link>
        </nav>
      </header>
      <MarketingHome />
    </main>
  );
}
