import type { Route } from "next";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function ProjectWorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const overviewHref = `/dashboard/${projectId}` as Route;
  const devicesHref = `/dashboard/${projectId}/devices` as Route;
  const assetsHref = `/dashboard/${projectId}/assets` as Route;
  const previewHref = `/dashboard/${projectId}/preview` as Route;

  return (
    <main className="site-shell">
      <AppHeader
        brandHref={overviewHref}
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: overviewHref, label: "Overview" },
          { href: devicesHref, label: "Devices" },
          { href: assetsHref, label: "Assets" },
          { href: previewHref, label: "Preview" }
        ]}
      />
      {children}
    </main>
  );
}
