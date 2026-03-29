import type { SkillVoteValue } from "@/lib/skills/types";

export type SkillVoteTransition = {
  nextValue: SkillVoteValue | null;
  upvoteDelta: number;
  downvoteDelta: number;
};

export function resolveSkillVoteTransition(
  currentValue: SkillVoteValue | null,
  requestedValue: SkillVoteValue,
): SkillVoteTransition {
  if (currentValue === requestedValue) {
    return {
      nextValue: null,
      upvoteDelta: requestedValue === "up" ? -1 : 0,
      downvoteDelta: requestedValue === "down" ? -1 : 0
    };
  }

  if (!currentValue) {
    return {
      nextValue: requestedValue,
      upvoteDelta: requestedValue === "up" ? 1 : 0,
      downvoteDelta: requestedValue === "down" ? 1 : 0
    };
  }

  return {
    nextValue: requestedValue,
    upvoteDelta: requestedValue === "up" ? 1 : -1,
    downvoteDelta: requestedValue === "down" ? 1 : -1
  };
}
