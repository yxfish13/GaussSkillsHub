import React from "react";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PublicVersionActions } from "@/components/skills/public-version-actions";
import { SkillCommentForm } from "@/components/skills/skill-comment-form";
import { SkillCommentList } from "@/components/skills/skill-comment-list";
import { SkillVotePanel } from "@/components/skills/skill-vote-panel";
import { SKILL_BROWSER_TOKEN_COOKIE_NAME, hashSkillBrowserToken } from "@/lib/skills/browser-token";
import { SectionHeading } from "@/components/ui/section-heading";
import { VersionSwitcher } from "@/components/skills/version-switcher";
import { MarkdownArticle } from "@/lib/markdown";
import { getSkillDetail } from "@/lib/skills/queries";
import { buildPublicFileHref } from "@/lib/storage";

export const dynamic = "force-dynamic";

type SkillDetailPageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    version?: string;
  };
};

export default async function SkillDetailPage({ params, searchParams }: SkillDetailPageProps) {
  const browserToken = cookies().get(SKILL_BROWSER_TOKEN_COOKIE_NAME)?.value;
  const browserTokenHash = browserToken ? hashSkillBrowserToken(browserToken) : undefined;
  const detail = await getSkillDetail(params.slug, searchParams?.version, browserTokenHash);

  if (!detail) {
    notFound();
  }

  const { selectedVersion } = detail;

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Skill 详情"
        title={selectedVersion.title}
        description={selectedVersion.summary}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.45fr]">
        <article className="space-y-6 rounded-[30px] border border-line bg-white/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-signal">
              {selectedVersion.version}
            </span>
            <span>{selectedVersion.downloadCount} 次下载</span>
            <span>发布者 {selectedVersion.submitterName}</span>
            <span>{detail.skill.totalUpvoteCount} 赞</span>
            <span>{detail.skill.totalDownvoteCount} 踩</span>
            <span>提交于 {new Date(detail.skill.createdAt).toLocaleDateString()}</span>
            <span>更新于 {new Date(detail.skill.updatedAt).toLocaleDateString()}</span>
            {selectedVersion.bundlePath ? (
              <a
                href={buildPublicFileHref(selectedVersion.bundlePath, selectedVersion.id)}
                className="rounded-full border border-line px-3 py-1 font-medium text-ink transition hover:border-signal hover:text-signal"
              >
                下载附件 {selectedVersion.bundleName || "Bundle"}
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PublicVersionActions skillSlug={detail.skill.slug} currentVersion={selectedVersion.version} />
            <SkillVotePanel
              skillId={detail.skill.id}
              skillSlug={detail.skill.slug}
              currentVote={detail.currentViewerVote}
            />
          </div>

          {selectedVersion.coverImagePath ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-line">
              <Image
                src={buildPublicFileHref(selectedVersion.coverImagePath)}
                alt={selectedVersion.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}

          <MarkdownArticle content={selectedVersion.markdownContent} />

          <section className="space-y-4 border-t border-line/70 pt-5">
            <h3 className="text-xl font-semibold text-ink">社区讨论</h3>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <SkillCommentForm skillId={detail.skill.id} skillSlug={detail.skill.slug} />
              <SkillCommentList comments={detail.comments} />
            </div>
          </section>
        </article>

        <VersionSwitcher
          skillSlug={detail.skill.slug}
          currentVersion={selectedVersion.version}
          versions={detail.approvedVersions}
        />
      </div>
    </section>
  );
}
