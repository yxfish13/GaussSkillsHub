import React from "react";
import Link from "next/link";

const navItems = [
  { href: "/skills", label: "Browse Skills" },
  { href: "/submit", label: "Submit a Skill" },
  { href: "/admin/login", label: "Admin Archive" }
];

export function SiteHeader() {
  return (
    <header className="relative border-b border-line pb-8 pt-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-signal">
            Curated Skills Registry
          </p>
          <div className="space-y-2">
            <Link href="/" className="inline-block text-5xl leading-none text-ink sm:text-6xl">
              <span className="font-[var(--font-display)] italic">Skills Hub</span>
            </Link>
            <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
              A living archive for community-submitted skills, versioned releases, and editorial review.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 lg:items-end">
          <nav aria-label="Primary" className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-signal hover:text-signal"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 self-start rounded-full border border-line bg-black/5 px-4 py-2 lg:self-auto">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
              Public Catalogue • Review Queue
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
