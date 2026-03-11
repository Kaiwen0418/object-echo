import Link from "next/link";

export function MarketingHome() {
  return (
    <section className="shell shell-hero">
      <div className="section-eyebrow">DIY personal collection showcase</div>
      <h1 className="shell-title">Build a public museum page for the devices, media, and objects you want to archive.</h1>
      <p className="shell-copy">
        Object Echo is a Next.js-based personal exhibition builder. Curators create projects, add devices and assets,
        then publish a scroll-driven museum page powered by a reusable Three.js presentation layer.
      </p>
      <div className="hero-actions">
        <Link className="primary-button" href="/dashboard">
          Start Building
        </Link>
        <Link className="ghost-button" href="/how-it-works">
          How it works
        </Link>
      </div>
    </section>
  );
}
