import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SkillCardRecord } from "@/lib/skills/queries";
import { buildPublicFileHref } from "@/lib/storage";

type SkillCardProps = {
  skill: SkillCardRecord;
};

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-white/70 transition hover:-translate-y-1 hover:border-signal"
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-[#e7dbc7]">
        {skill.coverImagePath ? (
          <Image
            src={buildPublicFileHref(skill.coverImagePath)}
            alt={skill.title}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-muted">
            No Cover
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">{skill.version}</span>
          <span className="text-xs text-muted">{skill.totalDownloadCount} 次下载</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-ink">
            <span className="font-[var(--font-display)] italic">{skill.title}</span>
          </h3>
          <p className="text-sm leading-6 text-muted">{skill.summary}</p>
        </div>
        <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
          <span>提交于 {new Date(skill.createdAt).toLocaleDateString()}</span>
          <span>更新于 {new Date(skill.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
