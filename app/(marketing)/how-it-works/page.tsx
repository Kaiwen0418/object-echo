import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
      </header>
      <section className="section-row">
        <article className="panel">
          <div className="section-eyebrow">Workflow</div>
          <h1>How it works</h1>
          <p>Create a project, add devices and assets, preview the Three.js museum timeline, then publish a public page.</p>
          <p>Supabase database/auth/storage and Sketchfab are wired as mockable interfaces so the local data shape already matches future production services.</p>
        </article>
      </section>
    </main>
  );
}
