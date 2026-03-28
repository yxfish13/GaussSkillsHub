import { prisma } from "@/lib/db";
import { canResubmitStatus, type SkillVersionStatus } from "@/lib/skills/types";

type ReviewDecision = "approved" | "rejected";

type ApplyReviewDecisionInput = {
  currentApprovedVersionId: string | null;
  targetVersionId: string;
  decision: ReviewDecision;
  reviewNote?: string;
};

export async function applyReviewDecision(input: ApplyReviewDecisionInput) {
  const reviewNote = input.reviewNote?.trim();

  if (input.decision === "rejected" && !reviewNote) {
    throw new Error("A review note is required when rejecting a version.");
  }

  return {
    targetVersionId: input.targetVersionId,
    nextStatus: input.decision satisfies SkillVersionStatus,
    archivePrevious: input.decision === "approved" && Boolean(input.currentApprovedVersionId),
    reviewNote
  };
}

type SaveSkillVersionDraftInput = {
  versionId: string;
  title: string;
  summary: string;
  markdownContent: string;
  reviewNotes?: string;
};

export async function saveSkillVersionDraft(input: SaveSkillVersionDraftInput) {
  return prisma.skillVersion.update({
    where: {
      id: input.versionId
    },
    data: {
      title: input.title.trim(),
      summary: input.summary.trim(),
      markdownContent: input.markdownContent.trim(),
      reviewNotes: input.reviewNotes?.trim() || null
    }
  });
}

type ReviewSkillVersionInput = {
  versionId: string;
  decision: ReviewDecision;
  reviewNote?: string;
  adminId: string;
};

export async function reviewSkillVersion(input: ReviewSkillVersionInput) {
  const targetVersion = await prisma.skillVersion.findUnique({
    where: {
      id: input.versionId
    }
  });

  if (!targetVersion) {
    throw new Error("Skill version not found.");
  }

  const currentApprovedVersion = await prisma.skillVersion.findFirst({
    where: {
      skillId: targetVersion.skillId,
      status: "approved",
      id: {
        not: targetVersion.id
      }
    }
  });

  const transition = await applyReviewDecision({
    currentApprovedVersionId: currentApprovedVersion?.id ?? null,
    targetVersionId: targetVersion.id,
    decision: input.decision,
    reviewNote: input.reviewNote
  });

  return prisma.$transaction(async (transaction) => {
    if (transition.archivePrevious && currentApprovedVersion) {
      await transaction.skillVersion.update({
        where: {
          id: currentApprovedVersion.id
        },
        data: {
          status: "archived",
          reviewedAt: new Date()
        }
      });

      await transaction.versionReviewLog.create({
        data: {
          skillVersionId: currentApprovedVersion.id,
          fromStatus: currentApprovedVersion.status,
          toStatus: "archived",
          note: "Superseded by a newer approved version.",
          actorType: "admin",
          actorId: input.adminId
        }
      });
    }

    const updatedVersion = await transaction.skillVersion.update({
      where: {
        id: targetVersion.id
      },
      data: {
        status: transition.nextStatus,
        reviewNotes: transition.reviewNote ?? null,
        reviewedAt: new Date()
      }
    });

    await transaction.versionReviewLog.create({
      data: {
        skillVersionId: updatedVersion.id,
        fromStatus: targetVersion.status,
        toStatus: updatedVersion.status,
        note: transition.reviewNote,
        actorType: "admin",
        actorId: input.adminId
      }
    });

    if (updatedVersion.status === "approved") {
      await transaction.skill.update({
        where: {
          id: updatedVersion.skillId
        },
        data: {
          latestApprovedVersionId: updatedVersion.id
        }
      });
    }

    return updatedVersion;
  });
}

export async function resubmitSkillVersionForReview(versionId: string, adminId: string) {
  const version = await prisma.skillVersion.findUnique({
    where: {
      id: versionId
    }
  });

  if (!version) {
    throw new Error("Skill version not found.");
  }

  if (!canResubmitStatus(version.status)) {
    throw new Error("Only rejected versions can be resubmitted.");
  }

  return prisma.$transaction(async (transaction) => {
    const updatedVersion = await transaction.skillVersion.update({
      where: {
        id: versionId
      },
      data: {
        status: "submitted",
        reviewedAt: null
      }
    });

    await transaction.versionReviewLog.create({
      data: {
        skillVersionId: updatedVersion.id,
        fromStatus: version.status,
        toStatus: "submitted",
        note: "Version resubmitted for review.",
        actorType: "admin",
        actorId: adminId
      }
    });

    return updatedVersion;
  });
}
