import React from "react";

export function SiteFooter() {
  return (
    <footer className="grid gap-4 border-t border-line py-6 text-sm text-muted md:grid-cols-[1fr_auto] md:items-end">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Public Release Notice</p>
        <p className="max-w-xl leading-6">
          所有公开版本都会保存在历史记录里。想更新说明或发布新版本时，请直接从详情页发起，不会覆盖旧内容。
        </p>
      </div>

      <div className="space-y-1 text-left md:text-right">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em]">Edition 02</p>
        <p>Built for public versioned skill publishing.</p>
      </div>
    </footer>
  );
}
