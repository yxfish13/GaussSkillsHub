import React from "react";
import { toggleSkillVote } from "@/app/actions/community";
import type { SkillVoteValue } from "@/lib/skills/types";

type SkillVotePanelProps = {
  skillId: string;
  skillSlug: string;
  currentVote: SkillVoteValue | null;
};

function getButtonClass(active: boolean) {
  if (active) {
    return "rounded-full border border-signal bg-signal px-4 py-2 text-sm font-semibold text-white transition";
  }

  return "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal";
}

export function SkillVotePanel({ skillId, skillSlug, currentVote }: SkillVotePanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={toggleSkillVote}>
        <input type="hidden" name="skillId" value={skillId} />
        <input type="hidden" name="slug" value={skillSlug} />
        <input type="hidden" name="direction" value="up" />
        <button type="submit" aria-pressed={currentVote === "up"} className={getButtonClass(currentVote === "up")}>
          点赞
        </button>
      </form>
      <form action={toggleSkillVote}>
        <input type="hidden" name="skillId" value={skillId} />
        <input type="hidden" name="slug" value={skillSlug} />
        <input type="hidden" name="direction" value="down" />
        <button
          type="submit"
          aria-pressed={currentVote === "down"}
          className={getButtonClass(currentVote === "down")}
        >
          点踩
        </button>
      </form>
    </div>
  );
}
