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

async function resolveCanonicalSkill(inputSkillId: string, inputSlug: string) {
  if (!inputSkillId || !inputSlug) {
    return null;
  }

  const skill = await prisma.skill.findUnique({
    where: {
      id: inputSkillId
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (!skill || skill.slug !== inputSlug) {
    return null;
  }

  return skill;
}

export async function submitSkillComment(formData: FormData) {
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const parsedComment = commentSchema.safeParse({
    authorName: getStringValue(formData.get("authorName")),
    content: getStringValue(formData.get("content"))
  });

  const canonicalSkill = await resolveCanonicalSkill(skillId, slug);

  if (!canonicalSkill) {
    redirect("/skills?status=invalid-comment");
  }

  if (!parsedComment.success) {
    redirect(`/skills/${slug || ""}?status=invalid-comment`);
  }

  await prisma.skillComment.create({
    data: {
      skillId: canonicalSkill.id,
      authorName: parsedComment.data.authorName,
      content: parsedComment.data.content
    }
  });

  revalidatePath("/skills");
  revalidatePath(`/skills/${canonicalSkill.slug}`);
  redirect(`/skills/${canonicalSkill.slug}?status=commented`);
}

export async function toggleSkillVote(formData: FormData) {
  const skillId = getStringValue(formData.get("skillId")).trim();
  const slug = getStringValue(formData.get("slug")).trim();
  const parsedDirection = voteDirectionSchema.safeParse(getStringValue(formData.get("direction")).trim());

  const canonicalSkill = await resolveCanonicalSkill(skillId, slug);

  if (!canonicalSkill) {
    redirect("/skills?status=invalid-vote");
  }

  if (!parsedDirection.success) {
    redirect(`/skills/${slug || ""}?status=invalid-vote`);
  }

  const browserTokenHash = await getOrCreateSkillBrowserTokenHash();

  await prisma.$transaction(async (transaction) => {
    const existingVote = await transaction.skillVote.findUnique({
      where: {
        skillId_browserTokenHash: {
          skillId: canonicalSkill.id,
          browserTokenHash
        }
      }
    });

    const transition = resolveSkillVoteTransition(existingVote?.value ?? null, parsedDirection.data);

    if (!transition.nextValue) {
      await transaction.skillVote.deleteMany({
        where: {
          skillId: canonicalSkill.id,
          browserTokenHash
        }
      });
    } else {
      await transaction.skillVote.upsert({
        where: {
          skillId_browserTokenHash: {
            skillId: canonicalSkill.id,
            browserTokenHash
          }
        },
        create: {
          skillId: canonicalSkill.id,
          browserTokenHash,
          value: transition.nextValue
        },
        update: {
          value: transition.nextValue
        }
      });
    }

    const [totalUpvoteCount, totalDownvoteCount] = await Promise.all([
      transaction.skillVote.count({
        where: {
          skillId: canonicalSkill.id,
          value: "up"
        }
      }),
      transaction.skillVote.count({
        where: {
          skillId: canonicalSkill.id,
          value: "down"
        }
      })
    ]);

    await transaction.skill.update({
      where: {
        id: canonicalSkill.id
      },
      data: {
        totalUpvoteCount,
        totalDownvoteCount
      }
    });
  });

  revalidatePath("/skills");
  revalidatePath(`/skills/${canonicalSkill.slug}`);
  redirect(`/skills/${canonicalSkill.slug}?status=voted`);
}
