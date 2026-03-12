import { AppHeader } from "@/components/layout/AppHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell">
      <AppHeader
        brandHref="/"
        variant="marketing"
        links={[
          { href: "/how-it-works", label: "How It Works" },
          { href: "/dashboard/new", label: "Create", tone: "primary" }
        ]}
      />
      {children}
    </main>
  );
}
