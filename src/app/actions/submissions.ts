"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SkillVersionStatus } from "@/lib/skills/types";
import { prisma } from "@/lib/db";
import { preparePublicReleaseTransition } from "@/lib/skills/service";
import { shouldCleanupSubmissionArtifacts } from "@/lib/skills/submission-errors";
import { removeStoredFile, saveUpload } from "@/lib/storage";
import { submissionSchema } from "@/lib/skills/validation";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function getOptionalFile(value: FormDataEntryValue | null) {
  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}

function getOptionalValue(value: string) {
  return value.trim() ? value.trim() : undefined;
}

export async function submitSkillVersion(formData: FormData) {
  const coverFile = getOptionalFile(formData.get("coverImage"));
  const bundleFile = getOptionalFile(formData.get("bundle"));

  const payload = {
    title: getStringValue(formData.get("title")),
    slug: getStringValue(formData.get("slug")),
    version: getStringValue(formData.get("version")),
    mode: getStringValue(formData.get("mode")) || "new",
    existingBundlePath: getStringValue(formData.get("existingBundlePath")),
    summary: getStringValue(formData.get("summary")),
    markdownContent: getStringValue(formData.get("markdownContent")),
    submitterName: getStringValue(formData.get("submitterName")),
    submitterContact: getStringValue(formData.get("submitterContact")),
    coverMimeType: coverFile?.type ?? "",
    bundleMimeType: bundleFile?.type ?? ""
  };

  const parsed = submissionSchema.safeParse(payload);

  if (!parsed.success) {
    redirect("/submit?status=invalid");
  }

  let savedCoverPath: string | null = null;
  let savedBundlePath: string | null = null;

  try {
    const skill = await prisma.skill.upsert({
      where: {
        slug: parsed.data.slug
      },
      update: {},
      create: {
        slug: parsed.data.slug
      }
    });

    const existingVersion = await prisma.skillVersion.findUnique({
      where: {
        skillId_version: {
          skillId: skill.id,
          version: parsed.data.version
        }
      }
    });

    if (existingVersion) {
      redirect("/submit?status=duplicate");
    }

    const normalizedExistingBundlePath = parsed.data.existingBundlePath?.trim() ?? "";
    const existingPublicBundle =
      !bundleFile && parsed.data.mode === "docs" && normalizedExistingBundlePath
        ? await prisma.skillVersion.findFirst({
            where: {
              skillId: skill.id,
              bundlePath: normalizedExistingBundlePath,
              status: {
                in: ["approved", "archived"]
              }
            },
            select: {
              bundlePath: true,
              bundleName: true
            }
          })
        : null;

    if (!bundleFile && parsed.data.mode === "docs" && normalizedExistingBundlePath && !existingPublicBundle?.bundlePath) {
      redirect("/submit?status=invalid");
    }

    const savedCover = coverFile ? await saveUpload(coverFile, "cover") : null;
    const savedBundle = bundleFile ? await saveUpload(bundleFile, "bundle") : null;

    savedCoverPath = savedCover?.path ?? null;
    savedBundlePath = savedBundle?.path ?? null;

    const bundlePath = savedBundle?.path ?? existingPublicBundle?.bundlePath ?? null;
    const bundleName = savedBundle?.originalName ?? existingPublicBundle?.bundleName ?? null;

    if (!bundlePath) {
      redirect("/submit?status=invalid");
    }

    const status: SkillVersionStatus = "approved";

    const publishedVersion = await prisma.$transaction(async (transaction) => {
      const currentSkill = await transaction.skill.findUnique({
        where: {
          id: skill.id
        },
        select: {
          latestApprovedVersionId: true
        }
      });

      const skillVersion = await transaction.skillVersion.create({
        data: {
          skillId: skill.id,
          version: parsed.data.version,
          title: parsed.data.title,
          summary: parsed.data.summary,
          markdownContent: parsed.data.markdownContent,
          coverImagePath: savedCover?.path,
          coverImageName: savedCover?.originalName,
          bundlePath,
          bundleName,
          submitterName: parsed.data.submitterName.trim(),
          submitterContact: getOptionalValue(parsed.data.submitterContact ?? ""),
          status
        }
      });

      const releaseTransition = preparePublicReleaseTransition({
        currentApprovedVersionId: currentSkill?.latestApprovedVersionId ?? null,
        targetVersionId: skillVersion.id
      });

      if (releaseTransition.archivePrevious && currentSkill?.latestApprovedVersionId) {
        const previousLatestVersion = await transaction.skillVersion.findUnique({
          where: {
            id: currentSkill.latestApprovedVersionId
          }
        });

        if (previousLatestVersion) {
          await transaction.skillVersion.update({
            where: {
              id: previousLatestVersion.id
            },
            data: {
              status: "archived",
              reviewedAt: new Date()
            }
          });

          await transaction.versionReviewLog.create({
            data: {
              skillVersionId: previousLatestVersion.id,
              fromStatus: previousLatestVersion.status,
              toStatus: "archived",
              note: "Superseded by a newer public submission.",
              actorType: "system"
            }
          });
        }
      }

      await transaction.versionReviewLog.create({
        data: {
          skillVersionId: skillVersion.id,
          fromStatus: null,
          toStatus: status,
          note: "Anonymous submission published immediately.",
          actorType: "system"
        }
      });

      await transaction.skill.update({
        where: {
          id: skill.id
        },
        data: {
          latestApprovedVersionId: skillVersion.id
        }
      });

      return skillVersion;
    });

    revalidatePath("/");
    revalidatePath("/skills");
    revalidatePath(`/skills/${skill.slug}`);
    redirect(`/skills/${skill.slug}?version=${encodeURIComponent(publishedVersion.version)}`);
  } catch (error) {
    if (!shouldCleanupSubmissionArtifacts(error)) {
      throw error;
    }

    await Promise.all([removeStoredFile(savedCoverPath), removeStoredFile(savedBundlePath)]);
    redirect("/submit?status=error");
  }
}
