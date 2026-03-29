import React from "react";
import type { SkillSort } from "@/lib/skills/queries";

type CatalogueSearchFormProps = {
  search?: string;
  currentSort: SkillSort;
};

export function CatalogueSearchForm({ search, currentSort }: CatalogueSearchFormProps) {
  return (
    <form action="/skills" method="get" className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="sort" value={currentSort} />
      <label htmlFor="skills-search" className="sr-only">
        检索 Skills
      </label>
      <input
        id="skills-search"
        name="q"
        type="search"
        defaultValue={search ?? ""}
        placeholder="检索 Skills 名称、简介、发布者"
        aria-label="检索 Skills"
        className="w-full min-w-[220px] flex-1 rounded-full border border-line bg-white/80 px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-signal focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full border border-signal bg-signal px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
      >
        搜索
      </button>
    </form>
  );
}
