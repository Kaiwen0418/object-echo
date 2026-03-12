import { AppHeader } from "@/components/layout/AppHeader";

export default function DashboardWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell">
      <AppHeader brandHref="/" links={[{ href: "/dashboard/new", label: "New Project", tone: "primary" }]} />
      {children}
    </main>
  );
}
