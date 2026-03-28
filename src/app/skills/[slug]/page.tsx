import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
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
  const detail = await getSkillDetail(params.slug, searchParams?.version);

  if (!detail) {
    notFound();
  }

  const { selectedVersion } = detail;

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Skill Record"
        title={selectedVersion.title}
        description={selectedVersion.summary}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.45fr]">
        <article className="space-y-6 rounded-[30px] border border-line bg-white/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-signal">
              {selectedVersion.version}
            </span>
            <span>Updated {new Date(selectedVersion.updatedAt).toLocaleDateString()}</span>
            {selectedVersion.bundlePath ? (
              <a
                href={buildPublicFileHref(selectedVersion.bundlePath)}
                className="rounded-full border border-line px-3 py-1 font-medium text-ink transition hover:border-signal hover:text-signal"
              >
                Download {selectedVersion.bundleName || "Bundle"}
              </a>
            ) : null}
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
