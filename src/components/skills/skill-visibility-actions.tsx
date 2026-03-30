"use client";

import React from "react";
import { hideSkillPublicly } from "@/app/actions/community";

type SkillVisibilityActionsProps = {
  skillId: string;
  slug: string;
};

export function SkillVisibilityActions({ skillId, slug }: SkillVisibilityActionsProps) {
  return (
    <form
      action={hideSkillPublicly}
      onSubmit={(event) => {
        if (!window.confirm("确认下架后，这个 Skill 将从公开列表和详情页中隐藏。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-500 hover:bg-amber-100"
      >
        下架这个 Skill
      </button>
    </form>
  );
}
