import React from "react";
import Link from "next/link";

type VersionSwitcherProps = {
  skillSlug: string;
  currentVersion: string;
  versions: Array<{
    id: string;
    version: string;
    title: string;
  }>;
};

export function VersionSwitcher({ skillSlug, currentVersion, versions }: VersionSwitcherProps) {
  return (
    <aside className="space-y-3 rounded-[24px] border border-line bg-white/60 p-5">
      <div className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Version History</p>
        <p className="text-sm leading-6 text-muted">Approved releases remain publicly readable.</p>
      </div>

      <div className="space-y-2">
        {versions.map((version) => (
          <Link
            key={version.id}
            href={`/skills/${skillSlug}?version=${encodeURIComponent(version.version)}`}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
              version.version === currentVersion
                ? "border-signal bg-signal/10 text-ink"
                : "border-line bg-white/70 text-muted hover:border-signal hover:text-signal"
            }`}
          >
            <span>{version.version}</span>
            <span className="max-w-[50%] truncate text-right">{version.title}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
