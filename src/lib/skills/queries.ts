import { SkillVersionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SkillCardRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  version: string;
  coverImagePath: string | null;
  updatedAt: string;
};

export type SkillDetailResult = {
  skill: {
    id: string;
    slug: string;
  };
  selectedVersion: {
    id: string;
    version: string;
    title: string;
    summary: string;
    markdownContent: string;
    bundlePath: string | null;
    bundleName: string | null;
    coverImagePath: string | null;
    createdAt: string;
    updatedAt: string;
  };
  approvedVersions: Array<{
    id: string;
    version: string;
    title: string;
  }>;
} | null;

export type AdminQueueRecord = {
  id: string;
  title: string;
  slug: string;
  version: string;
  status: SkillVersionStatus;
  submittedAt: string;
};

function toIsoString(value: Date) {
  return value.toISOString();
}

export async function listLatestApprovedSkills(search?: string) {
  const query = search?.trim();

  const skills = await prisma.skill.findMany({
    where: {
      latestApprovedVersionId: {
        not: null
      },
      ...(query
        ? {
            OR: [
              {
                slug: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                latestApprovedVersion: {
                  is: {
                    title: {
                      contains: query,
                      mode: "insensitive"
                    }
                  }
                }
              },
              {
                latestApprovedVersion: {
                  is: {
                    summary: {
                      contains: query,
                      mode: "insensitive"
                    }
                  }
                }
              }
            ]
          }
        : {})
    },
    include: {
      latestApprovedVersion: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return skills
    .filter((skill) => skill.latestApprovedVersion)
    .map<SkillCardRecord>((skill) => ({
      id: skill.id,
      slug: skill.slug,
      title: skill.latestApprovedVersion!.title,
      summary: skill.latestApprovedVersion!.summary,
      version: skill.latestApprovedVersion!.version,
      coverImagePath: skill.latestApprovedVersion!.coverImagePath,
      updatedAt: toIsoString(skill.latestApprovedVersion!.updatedAt)
    }));
}

export async function getSkillDetail(slug: string, requestedVersion?: string): Promise<SkillDetailResult> {
  const skill = await prisma.skill.findUnique({
    where: {
      slug
    },
    include: {
      latestApprovedVersion: true,
      versions: {
        where: {
          status: {
            in: ["approved", "archived"]
          }
        },
        orderBy: {
          submittedAt: "desc"
        }
      }
    }
  });

  if (!skill?.latestApprovedVersion) {
    return null;
  }

  const selectedVersion =
    skill.versions.find((version) => version.version === requestedVersion) ?? skill.latestApprovedVersion;

  return {
    skill: {
      id: skill.id,
      slug: skill.slug
    },
    selectedVersion: {
      id: selectedVersion.id,
      version: selectedVersion.version,
      title: selectedVersion.title,
      summary: selectedVersion.summary,
      markdownContent: selectedVersion.markdownContent,
      bundlePath: selectedVersion.bundlePath,
      bundleName: selectedVersion.bundleName,
      coverImagePath: selectedVersion.coverImagePath,
      createdAt: toIsoString(selectedVersion.createdAt),
      updatedAt: toIsoString(selectedVersion.updatedAt)
    },
    approvedVersions: skill.versions.map((version) => ({
      id: version.id,
      version: version.version,
      title: version.title
    }))
  };
}

export async function listAdminSkillVersions() {
  const versions = await prisma.skillVersion.findMany({
    include: {
      skill: true
    },
    orderBy: {
      submittedAt: "desc"
    }
  });

  const mapped = versions.map<AdminQueueRecord>((version) => ({
    id: version.id,
    title: version.title,
    slug: version.skill.slug,
    version: version.version,
    status: version.status,
    submittedAt: toIsoString(version.submittedAt)
  }));

  return {
    submitted: mapped.filter((version) => version.status === "submitted"),
    approved: mapped.filter((version) => version.status === "approved" || version.status === "archived"),
    rejected: mapped.filter((version) => version.status === "rejected")
  };
}

export async function getSkillVersionForReview(id: string) {
  const version = await prisma.skillVersion.findUnique({
    where: {
      id
    },
    include: {
      skill: true,
      reviewLogs: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!version) {
    return null;
  }

  const currentApprovedVersion = await prisma.skillVersion.findFirst({
    where: {
      skillId: version.skillId,
      status: "approved",
      id: {
        not: version.id
      }
    },
    orderBy: {
      reviewedAt: "desc"
    }
  });

  return {
    version: {
      id: version.id,
      skillId: version.skillId,
      slug: version.skill.slug,
      title: version.title,
      summary: version.summary,
      markdownContent: version.markdownContent,
      status: version.status,
      version: version.version,
      reviewNotes: version.reviewNotes,
      bundlePath: version.bundlePath,
      bundleName: version.bundleName,
      coverImagePath: version.coverImagePath,
      submitterName: version.submitterName,
      submitterContact: version.submitterContact,
      submittedAt: toIsoString(version.submittedAt)
    },
    currentApprovedVersion: currentApprovedVersion
      ? {
          id: currentApprovedVersion.id,
          version: currentApprovedVersion.version,
          title: currentApprovedVersion.title
        }
      : null,
    reviewLog: version.reviewLogs.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      note: entry.note,
      createdAt: toIsoString(entry.createdAt)
    }))
  };
}
