import React from "react";
import Link from "next/link";

type PublicVersionActionsProps = {
  skillSlug: string;
  currentVersion: string;
};

export function PublicVersionActions({ skillSlug, currentVersion }: PublicVersionActionsProps) {
  const encodedVersion = encodeURIComponent(currentVersion);

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/submit?from=${skillSlug}&base=${encodedVersion}&mode=docs`}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
      >
        更新说明
      </Link>
      <Link
        href={`/submit?from=${skillSlug}&base=${encodedVersion}&mode=release`}
        className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        发布新版本
      </Link>
    </div>
  );
}
