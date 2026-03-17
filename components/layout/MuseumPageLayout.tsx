import { AppHeader, GLOBAL_HEADER_LINKS } from "@/components/layout/AppHeader";

export function MuseumPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell site-shell-immersive">
      <AppHeader brandHref="/" variant="marketing" links={GLOBAL_HEADER_LINKS} />
      {children}
    </main>
  );
}
