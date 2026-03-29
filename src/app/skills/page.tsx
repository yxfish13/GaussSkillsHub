import React from "react";
import { CatalogueSearchForm } from "@/components/skills/catalogue-search-form";
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
  return value === "upvotes" || value === "downvotes" || value === "created" || value === "updated" || value === "downloads"
    ? value
    : "upvotes";
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const sort = getSkillSort(searchParams?.sort);
  const search = searchParams?.q?.trim();
  const skills = await listLatestApprovedSkills(search, sort);

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="技能广场"
        title="浏览公开 Skills"
        description="默认展示每个 Skill 的最新公开版本，你也可以切换排序方式，从热度或时间维度发现内容。"
      />

      <CatalogueSearchForm currentSort={sort} search={search} />
      <CatalogueSortBar currentSort={sort} search={search} />

      <div className="space-y-4">
        <div className="text-xs text-muted">{search ? `检索词 "${search}"` : "展示全部 Skills"}</div>
        {skills.length ? (
          <ul aria-label="Skills 列表" className="space-y-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </ul>
        ) : (
          <div className="rounded-[28px] border border-dashed border-line bg-white/60 p-10 text-sm text-muted">
            {search ? "没有找到匹配的 Skills，请试试别的关键词。" : "还没有公开的 Skills。"}
          </div>
        )}
      </div>
    </section>
  );
}
