"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveSkillVoteTransition } from "@/lib/skills/community";
import { getOrCreateSkillBrowserTokenHash } from "@/lib/skills/browser-token";
import { commentSchema, voteDirectionSchema } from "@/lib/skills/validation";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function submitSkillComment(formData: FormData) {
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const parsedComment = commentSchema.safeParse({
    authorName: getStringValue(formData.get("authorName")),
    content: getStringValue(formData.get("content"))
  });

  if (!skillId || !slug || !parsedComment.success) {
    redirect(`/skills/${slug || ""}?status=invalid-comment`);
  }

  await prisma.skillComment.create({
    data: {
      skillId,
      authorName: parsedComment.data.authorName,
      content: parsedComment.data.content
    }
  });

  revalidatePath("/skills");
  revalidatePath(`/skills/${slug}`);
  redirect(`/skills/${slug}?status=commented`);
}

export async function toggleSkillVote(formData: FormData) {
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const parsedDirection = voteDirectionSchema.safeParse(getStringValue(formData.get("direction")).trim());

  if (!skillId || !slug || !parsedDirection.success) {
    redirect(`/skills/${slug || ""}?status=invalid-vote`);
  }

  const browserTokenHash = await getOrCreateSkillBrowserTokenHash();

  await prisma.$transaction(async (transaction) => {
    const existingVote = await transaction.skillVote.findUnique({
      where: {
        skillId_browserTokenHash: {
          skillId,
          browserTokenHash
        }
      }
    });

    const transition = resolveSkillVoteTransition(existingVote?.value ?? null, parsedDirection.data);

    if (!transition.nextValue && existingVote) {
      await transaction.skillVote.delete({
        where: {
          id: existingVote.id
        }
      });
    } else if (transition.nextValue && existingVote) {
      await transaction.skillVote.update({
        where: {
          id: existingVote.id
        },
        data: {
          value: transition.nextValue
        }
      });
    } else if (transition.nextValue) {
      await transaction.skillVote.create({
        data: {
          skillId,
          browserTokenHash,
          value: transition.nextValue
        }
      });
    }

    await transaction.skill.update({
      where: {
        id: skillId
      },
      data: {
        totalUpvoteCount: {
          increment: transition.upvoteDelta
        },
        totalDownvoteCount: {
          increment: transition.downvoteDelta
        }
      }
    });
  });

  revalidatePath("/skills");
  revalidatePath(`/skills/${slug}`);
  redirect(`/skills/${slug}?status=voted`);
}
