"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SkillVersionStatus } from "@/lib/skills/types";
import { prisma } from "@/lib/db";
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

    revalidatePath("/skills");
    redirect("/submit?status=success");
  } catch (error) {
    await Promise.all([removeStoredFile(savedCoverPath), removeStoredFile(savedBundlePath)]);

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    redirect("/submit?status=error");
  }
}
