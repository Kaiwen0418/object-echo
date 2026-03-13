import { AppHeader, GLOBAL_HEADER_LINKS } from "@/components/layout/AppHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell">
      <AppHeader brandHref="/" variant="marketing" links={GLOBAL_HEADER_LINKS} />
      {children}
    </main>
  );
}
