import React, { type ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-3 border-b border-line pb-5">
      {eyebrow ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">{eyebrow}</p>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-3xl leading-tight text-ink sm:text-4xl">
          <span className="font-[var(--font-display)] italic">{title}</span>
        </h2>
        {description ? <div className="max-w-2xl text-sm leading-6 text-muted">{description}</div> : null}
      </div>
    </div>
  );
}
