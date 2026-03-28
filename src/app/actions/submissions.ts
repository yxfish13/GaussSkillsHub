"use server";

import type { SkillVersionStatus } from "@/lib/skills/types";
import { prisma } from "@/lib/db";
import { removeStoredFile, saveUpload } from "@/lib/storage";
import { submissionSchema } from "@/lib/skills/validation";

type SubmissionActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

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

export async function submitSkillVersion(
  _previousState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const coverFile = getOptionalFile(formData.get("coverImage"));
  const bundleFile = getOptionalFile(formData.get("bundle"));

  const payload = {
    title: getStringValue(formData.get("title")),
    slug: getStringValue(formData.get("slug")),
    version: getStringValue(formData.get("version")),
    summary: getStringValue(formData.get("summary")),
    markdownContent: getStringValue(formData.get("markdownContent")),
    submitterName: getStringValue(formData.get("submitterName")),
    submitterContact: getStringValue(formData.get("submitterContact")),
    coverMimeType: coverFile?.type ?? "",
    bundleMimeType: bundleFile?.type ?? ""
  };

  const parsed = submissionSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted submission fields.",
      errors: parsed.error.flatten().fieldErrors
    };
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
      return {
        ok: false,
        message: "That version already exists for this skill.",
        errors: {
          version: ["Choose a new version number before submitting."]
        }
      };
    }

    const savedCover = coverFile ? await saveUpload(coverFile, "cover") : null;
    const savedBundle = bundleFile ? await saveUpload(bundleFile, "bundle") : null;

    savedCoverPath = savedCover?.path ?? null;
    savedBundlePath = savedBundle?.path ?? null;

    const status: SkillVersionStatus = "submitted";

    await prisma.$transaction(async (transaction) => {
      const skillVersion = await transaction.skillVersion.create({
        data: {
          skillId: skill.id,
          version: parsed.data.version,
          title: parsed.data.title,
          summary: parsed.data.summary,
          markdownContent: parsed.data.markdownContent,
          coverImagePath: savedCover?.path,
          coverImageName: savedCover?.originalName,
          bundlePath: savedBundle?.path,
          bundleName: savedBundle?.originalName,
          submitterName: getOptionalValue(parsed.data.submitterName ?? ""),
          submitterContact: getOptionalValue(parsed.data.submitterContact ?? ""),
          status
        }
      });

      await transaction.versionReviewLog.create({
        data: {
          skillVersionId: skillVersion.id,
          toStatus: status,
          note: "Anonymous submission received.",
          actorType: "system"
        }
      });
    });

    return {
      ok: true,
      message: "Submission received. It is now waiting for admin review."
    };
  } catch (error) {
    await Promise.all([removeStoredFile(savedCoverPath), removeStoredFile(savedBundlePath)]);

    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save the submission right now."
    };
  }
}
