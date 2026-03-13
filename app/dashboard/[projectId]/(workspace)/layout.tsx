import type { Route } from "next";
import { AppHeader, GLOBAL_HEADER_LINKS } from "@/components/layout/AppHeader";

export default async function ProjectWorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const overviewHref = `/dashboard/${projectId}` as Route;

  return (
    <main className="site-shell">
      <AppHeader brandHref={overviewHref} links={GLOBAL_HEADER_LINKS} />
      {children}
    </main>
  );
}
