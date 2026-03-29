export const skillVersionStatuses = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "archived"
] as const;

export type SkillVersionStatus = (typeof skillVersionStatuses)[number];
export const skillVoteValues = ["up", "down"] as const;
export type SkillVoteValue = (typeof skillVoteValues)[number];

export function archivePreviousStatus(nextStatus: SkillVersionStatus) {
  return nextStatus === "approved" ? "archived" : nextStatus;
}

export function canResubmitStatus(status: SkillVersionStatus) {
  return status === "rejected";
}

export function isPublicSkillVersionStatus(status: SkillVersionStatus) {
  return status === "approved" || status === "archived";
}
