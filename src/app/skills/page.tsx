import React from "react";
import { CatalogueSortBar } from "@/components/skills/catalogue-sort-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { SkillCard } from "@/components/skills/skill-card";
import { listLatestApprovedSkills, type SkillSort } from "@/lib/skills/queries";

export const dynamic = "force-dynamic";

type SkillsPageProps = {
  searchParams?: {
    q?: string;
    sort?: string;
  };
};

function getSkillSort(value?: string): SkillSort {
  return value === "created" || value === "updated" || value === "downloads" ? value : "downloads";
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const sort = getSkillSort(searchParams?.sort);
  const skills = await listLatestApprovedSkills(searchParams?.q, sort);

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="技能广场"
        title="浏览公开 Skills"
        description="默认展示每个 Skill 的最新公开版本，你也可以切换排序方式，从热度或时间维度发现内容。"
      />

      <CatalogueSortBar currentSort={sort} search={searchParams?.q} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {skills.length ? (
          skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)
        ) : (
          <div className="rounded-[28px] border border-dashed border-line bg-white/60 p-10 text-sm text-muted">
            还没有公开的 Skills。
          </div>
        )}
      </div>
    </section>
  );
}
