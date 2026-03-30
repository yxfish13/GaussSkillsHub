"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { removeStoredFile } from "@/lib/storage";
import { clearAdminSession, persistAdminSession, requireAdminSession } from "@/lib/auth-server";
import { verifyAdminPassword } from "@/lib/auth";
import { reviewDraftSchema, reviewIntentSchema } from "@/lib/skills/validation";
import {
  resubmitSkillVersionForReview,
  reviewSkillVersion,
  saveSkillVersionDraft
} from "@/lib/skills/service";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

async function resolveCanonicalSkill(skillId: string, slug: string) {
  if (!skillId || !slug) {
    return null;
  }

  const skill = await prisma.skill.findUnique({
    where: {
      id: skillId
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (!skill || skill.slug !== slug) {
    return null;
  }

  return skill;
}

function revalidateSkillAdminPaths(slug: string, versionId?: string) {
  revalidatePath("/");
  revalidatePath("/skills");
  revalidatePath(`/skills/${slug}`);
  revalidatePath("/admin");

  if (versionId) {
    revalidatePath(`/admin/versions/${versionId}`);
  }
}

export async function loginAdmin(formData: FormData) {
  const username = getStringValue(formData.get("username")).trim();
  const password = getStringValue(formData.get("password"));

  const admin = await prisma.adminUser.findUnique({
    where: {
      username
    }
  });

  if (!admin) {
    redirect("/admin/login?status=invalid");
  }

  const passwordMatches = await verifyAdminPassword(password, admin.passwordHash);

  if (!passwordMatches) {
    redirect("/admin/login?status=invalid");
  }

  await persistAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAdmin() {
  clearAdminSession();
  redirect("/admin/login");
}

export async function hideSkillAsAdmin(formData: FormData) {
  await requireAdminSession();
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const versionId = getStringValue(formData.get("versionId")).trim();
  const canonicalSkill = await resolveCanonicalSkill(skillId, slug);

  if (!canonicalSkill) {
    redirect("/admin?status=invalid-skill");
  }

  await prisma.skill.update({
    where: {
      id: canonicalSkill.id
    },
    data: {
      visibility: "hidden"
    }
  });

  revalidateSkillAdminPaths(canonicalSkill.slug, versionId || undefined);
  redirect(versionId ? `/admin/versions/${versionId}?status=hidden` : "/admin?status=hidden");
}

export async function restoreSkillAsAdmin(formData: FormData) {
  await requireAdminSession();
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const versionId = getStringValue(formData.get("versionId")).trim();
  const canonicalSkill = await resolveCanonicalSkill(skillId, slug);

  if (!canonicalSkill) {
    redirect("/admin?status=invalid-skill");
  }

  await prisma.skill.update({
    where: {
      id: canonicalSkill.id
    },
    data: {
      visibility: "public"
    }
  });

  revalidateSkillAdminPaths(canonicalSkill.slug, versionId || undefined);
  redirect(versionId ? `/admin/versions/${versionId}?status=restored` : "/admin?status=restored");
}

export async function deleteSkillAsAdmin(formData: FormData) {
  await requireAdminSession();
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const canonicalSkill = await resolveCanonicalSkill(skillId, slug);

  if (!canonicalSkill) {
    redirect("/admin?status=invalid-skill");
  }

  const skill = await prisma.skill.findUnique({
    where: {
      id: canonicalSkill.id
    },
    include: {
      versions: {
        select: {
          coverImagePath: true,
          bundlePath: true
        }
      }
    }
  });

  if (!skill || skill.slug !== slug) {
    redirect("/admin?status=invalid-skill");
  }

  const filePaths = Array.from(
    new Set(
      skill.versions
        .flatMap((version) => [version.coverImagePath, version.bundlePath])
        .filter((path): path is string => Boolean(path)),
    ),
  );

  await prisma.skill.delete({
    where: {
      id: skill.id
    }
  });

  await Promise.allSettled(filePaths.map((path) => removeStoredFile(path)));

  revalidateSkillAdminPaths(skill.slug);
  redirect("/admin?status=deleted");
}

export async function submitAdminReviewAction(formData: FormData) {
  const session = await requireAdminSession();
  const versionId = getStringValue(formData.get("versionId"));
  const title = getStringValue(formData.get("title"));
  const summary = getStringValue(formData.get("summary"));
  const markdownContent = getStringValue(formData.get("markdownContent"));
  const reviewNote = getStringValue(formData.get("reviewNote"));
  const parsedIntent = reviewIntentSchema.safeParse(getStringValue(formData.get("intent")));

  if (!parsedIntent.success) {
    redirect(`/admin/versions/${versionId}?status=invalid-intent`);
  }

  const intent = parsedIntent.data;
  const editorialDraft = {
    title,
    summary,
    markdownContent
  };

  if ((intent === "approve" || intent === "resubmit") && !reviewDraftSchema.safeParse(editorialDraft).success) {
    redirect(`/admin/versions/${versionId}?status=invalid-content`);
  }

  if (intent === "reject" && !reviewNote.trim()) {
    redirect(`/admin/versions/${versionId}?status=review-note-required`);
  }

  try {
    if (intent === "save") {
      await saveSkillVersionDraft({
        versionId,
        title,
        summary,
        markdownContent,
        reviewNotes: reviewNote
      });
    } else if (intent === "approve") {
      await saveSkillVersionDraft({
        versionId,
        title,
        summary,
        markdownContent,
        reviewNotes: reviewNote
      });

      await reviewSkillVersion({
        versionId,
        decision: "approved",
        reviewNote,
        adminId: session.adminId
      });
    } else if (intent === "reject") {
      await saveSkillVersionDraft({
        versionId,
        title,
        summary,
        markdownContent,
        reviewNotes: reviewNote
      });

      await reviewSkillVersion({
        versionId,
        decision: "rejected",
        reviewNote,
        adminId: session.adminId
      });
    } else if (intent === "resubmit") {
      await saveSkillVersionDraft({
        versionId,
        title,
        summary,
        markdownContent,
        reviewNotes: reviewNote
      });

      await resubmitSkillVersionForReview(versionId, session.adminId);
    }

    const version = await prisma.skillVersion.findUnique({
      where: {
        id: versionId
      },
      include: {
        skill: true
      }
    });

    if (version) {
      revalidatePath("/");
      revalidatePath("/skills");
      revalidatePath(`/skills/${version.skill.slug}`);
      revalidatePath("/admin");
      revalidatePath(`/admin/versions/${versionId}`);
    }

    const successStatus =
      intent === "save"
        ? "saved"
        : intent === "approve"
          ? "approved"
          : intent === "reject"
            ? "rejected"
            : "resubmitted";

    redirect(`/admin/versions/${versionId}?status=${successStatus}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    redirect(`/admin/versions/${versionId}?status=error`);
  }
}
