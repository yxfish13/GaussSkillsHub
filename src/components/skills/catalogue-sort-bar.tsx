import React from "react";
import Link from "next/link";
import type { SkillSort } from "@/lib/skills/queries";

type CatalogueSortBarProps = {
  currentSort: SkillSort;
  search?: string;
};

const sortOptions: Array<{ value: SkillSort; label: string }> = [
  { value: "upvotes", label: "按点赞排序" },
  { value: "downvotes", label: "按点踩排序" },
  { value: "downloads", label: "按下载量排序" },
  { value: "updated", label: "按更新时间排序" },
  { value: "created", label: "按提交时间排序" }
];

export function CatalogueSortBar({ currentSort, search }: CatalogueSortBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {sortOptions.map((option) => {
        const params = new URLSearchParams();
        params.set("sort", option.value);

        if (search?.trim()) {
          params.set("q", search.trim());
        }

        return (
          <Link
            key={option.value}
            href={`/skills?${params.toString()}`}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              option.value === currentSort
                ? "border-signal bg-signal text-white"
                : "border-line bg-white/70 text-ink hover:border-signal hover:text-signal"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
