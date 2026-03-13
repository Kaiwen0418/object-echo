import { AppHeader, GLOBAL_HEADER_LINKS } from "@/components/layout/AppHeader";

export default function DashboardWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell">
      <AppHeader brandHref="/" links={GLOBAL_HEADER_LINKS} />
      {children}
    </main>
  );
}
