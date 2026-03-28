import React from "react";

export default function HomePage() {
  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-3">
        <p className="uppercase tracking-[0.5em] text-xs text-signal">curated release</p>
        <h2 className="font-display text-4xl text-ink">Skills Hub</h2>
        <p className="text-lg text-[#3a2b1f]">
          Submit a new skill or explore transparent reviews, curated with editorial care.
        </p>
      </div>
      <a
        href="/submit"
        className="inline-flex items-center gap-2 font-semibold text-signal border border-signal px-4 py-2 rounded-full transition hover:bg-signal hover:text-white max-w-fit"
      >
        Submit a Skill
      </a>
    </section>
  );
}
