import React from "react";
import Link from "next/link";
import type { AdminQueueRecord } from "@/lib/skills/queries";

type ReviewQueueProps = {
  title: string;
  versions: AdminQueueRecord[];
};

export function ReviewQueue({ title, versions }: ReviewQueueProps) {
  return (
    <section className="space-y-4 rounded-[28px] border border-line bg-white/70 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-ink">
          <span className="font-[var(--font-display)] italic">{title}</span>
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
          {versions.length} items
        </span>
      </div>

      <div className="space-y-3">
        {versions.length ? (
          versions.map((version) => (
            <Link
              key={version.id}
              href={`/admin/versions/${version.id}`}
              className="grid gap-3 rounded-2xl border border-line bg-[#fcfaf7] p-4 transition hover:border-signal"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-ink">{version.title}</p>
                  <p className="text-sm text-muted">{version.slug}</p>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">
                  {version.version}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{version.status}</span>
                <span>{new Date(version.submittedAt).toLocaleString()}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-sm text-muted">
            No versions in this queue.
          </div>
        )}
      </div>
    </section>
  );
}
