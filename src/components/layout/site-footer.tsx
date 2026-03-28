import React from "react";

export function SiteFooter() {
  return (
    <footer className="grid gap-4 border-t border-line py-6 text-sm text-muted md:grid-cols-[1fr_auto] md:items-end">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Archive Notice</p>
        <p className="max-w-xl leading-6">
          Anonymous submissions are reviewed by an administrator before publication. Historical approved
          versions remain readable as part of the public record.
        </p>
      </div>

      <div className="space-y-1 text-left md:text-right">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em]">Edition 01</p>
        <p>Built for versioned skill publishing.</p>
      </div>
    </footer>
  );
}
