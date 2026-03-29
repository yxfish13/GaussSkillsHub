import React from "react";
import Link from "next/link";
import type { SkillCardRecord } from "@/lib/skills/queries";

type SkillCardProps = {
  skill: SkillCardRecord;
};

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <li className="rounded-2xl border border-line bg-white/70 px-4 py-3 transition hover:border-signal">
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto] md:items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">
            <span className="font-[var(--font-display)] italic">{skill.title}</span>
          </h3>
          <p className="text-sm leading-6 text-muted">{skill.summary}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span>版本 {skill.version}</span>
            <span>发布者 {skill.submitterName}</span>
            <span>更新于 {new Date(skill.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-muted md:grid-cols-1 md:justify-items-end">
          <span>{skill.totalUpvoteCount} 赞</span>
          <span>{skill.totalDownvoteCount} 踩</span>
          <span>{skill.totalDownloadCount} 次下载</span>
        </div>

        <div className="justify-self-start md:justify-self-end">
          <Link
            href={`/skills/${skill.slug}`}
            aria-label={`查看 ${skill.title} 详情`}
            className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-signal hover:text-signal"
          >
            查看详情
          </Link>
        </div>
      </div>
    </li>
  );
}
