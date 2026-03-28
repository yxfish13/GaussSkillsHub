"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
