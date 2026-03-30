// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectError = new Error("NEXT_REDIRECT");

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw redirectError;
  }),
  revalidatePath: vi.fn(),
  getOrCreateSkillBrowserTokenHash: vi.fn(),
  prisma: {
    skillComment: {
      create: vi.fn()
    },
    skill: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    skillVote: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma
}));

vi.mock("@/lib/skills/browser-token", () => ({
  getOrCreateSkillBrowserTokenHash: mocks.getOrCreateSkillBrowserTokenHash
}));

import { hideSkillPublicly, submitSkillComment, toggleSkillVote } from "@/app/actions/community";

function createCommentFormData(overrides?: { skillId?: string; slug?: string; authorName?: string; content?: string }) {
  const formData = new FormData();
  formData.set("skillId", overrides?.skillId ?? "skill-1");
  formData.set("slug", overrides?.slug ?? "superpowers");
  formData.set("authorName", overrides?.authorName ?? "Ada");
  formData.set("content", overrides?.content ?? "这是评论内容。");
  return formData;
}

function createVoteFormData(overrides?: { skillId?: string; slug?: string; direction?: string }) {
  const formData = new FormData();
  formData.set("skillId", overrides?.skillId ?? "skill-1");
  formData.set("slug", overrides?.slug ?? "superpowers");
  formData.set("direction", overrides?.direction ?? "up");
  return formData;
}

function createHideFormData(overrides?: { skillId?: string; slug?: string }) {
  const formData = new FormData();
  formData.set("skillId", overrides?.skillId ?? "skill-1");
  formData.set("slug", overrides?.slug ?? "superpowers");
  return formData;
}

describe("community server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.skill.findUnique.mockResolvedValue({
      id: "skill-1",
      slug: "superpowers"
    });
    mocks.prisma.skillComment.create.mockResolvedValue({
      id: "comment-1"
    });
    mocks.prisma.$transaction.mockImplementation(async (handler: (tx: typeof mocks.prisma) => Promise<unknown>) =>
      handler(mocks.prisma as never),
    );
    mocks.getOrCreateSkillBrowserTokenHash.mockResolvedValue("hashed-browser-token");
  });

  it("rejects mismatched skill id and slug before comment writes", async () => {
    const formData = createCommentFormData({
      skillId: "skill-1",
      slug: "other-skill"
    });

    await expect(submitSkillComment(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillComment.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/skills?status=invalid-comment");
  });

  it("rejects invalid comments with commentSchema and does not create rows", async () => {
    const formData = createCommentFormData({
      authorName: "   "
    });

    await expect(submitSkillComment(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillComment.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=invalid-comment");
  });

  it("creates comments, revalidates pages, and redirects with a fresh comment marker", async () => {
    const formData = createCommentFormData();

    await expect(submitSkillComment(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillComment.create).toHaveBeenCalledWith({
      data: {
        skillId: "skill-1",
        authorName: "Ada",
        content: "这是评论内容。"
      }
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills/superpowers");
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=commented&commentId=comment-1");
  });

  it("hides a skill publicly and redirects back to the catalogue", async () => {
    const formData = createHideFormData();

    await expect(hideSkillPublicly(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        visibility: "hidden"
      }
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills/superpowers");
    expect(mocks.redirect).toHaveBeenCalledWith("/skills?status=hidden");
  });

  it("rejects unknown skill targets before vote writes", async () => {
    const formData = createVoteFormData();
    mocks.prisma.skill.findUnique.mockResolvedValueOnce(null);

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/skills?status=invalid-vote");
  });

  it("creates a new upvote when no prior vote exists", async () => {
    const formData = createVoteFormData({
      direction: "up"
    });
    mocks.prisma.skillVote.findUnique.mockResolvedValueOnce(null);
    mocks.prisma.skillVote.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.getOrCreateSkillBrowserTokenHash).toHaveBeenCalled();
    expect(mocks.prisma.skillVote.upsert).toHaveBeenCalledWith({
      where: {
        skillId_browserTokenHash: {
          skillId: "skill-1",
          browserTokenHash: "hashed-browser-token"
        }
      },
      create: {
        skillId: "skill-1",
        browserTokenHash: "hashed-browser-token",
        value: "up"
      },
      update: {
        value: "up"
      }
    });
    expect(mocks.prisma.skillVote.count).toHaveBeenNthCalledWith(1, {
      where: {
        skillId: "skill-1",
        value: "up"
      }
    });
    expect(mocks.prisma.skillVote.count).toHaveBeenNthCalledWith(2, {
      where: {
        skillId: "skill-1",
        value: "down"
      }
    });
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        totalUpvoteCount: 3,
        totalDownvoteCount: 1
      }
    });
  });

  it("deletes an existing vote when the same direction is clicked again", async () => {
    const formData = createVoteFormData({
      direction: "down"
    });
    mocks.prisma.skillVote.findUnique.mockResolvedValueOnce({
      id: "vote-1",
      value: "down"
    });
    mocks.prisma.skillVote.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillVote.deleteMany).toHaveBeenCalledWith({
      where: {
        skillId: "skill-1",
        browserTokenHash: "hashed-browser-token"
      }
    });
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        totalUpvoteCount: 2,
        totalDownvoteCount: 0
      }
    });
  });

  it("switches existing vote direction and updates aggregate counters", async () => {
    const formData = createVoteFormData({
      direction: "down"
    });
    mocks.prisma.skillVote.findUnique.mockResolvedValueOnce({
      id: "vote-1",
      value: "up"
    });
    mocks.prisma.skillVote.count.mockResolvedValueOnce(4).mockResolvedValueOnce(6);

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillVote.upsert).toHaveBeenCalledWith({
      where: {
        skillId_browserTokenHash: {
          skillId: "skill-1",
          browserTokenHash: "hashed-browser-token"
        }
      },
      create: {
        skillId: "skill-1",
        browserTokenHash: "hashed-browser-token",
        value: "down"
      },
      update: {
        value: "down"
      }
    });
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        totalUpvoteCount: 4,
        totalDownvoteCount: 6
      }
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills/superpowers");
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=voted");
  });

  it("retries retryable transaction conflicts with serializable isolation", async () => {
    const formData = createVoteFormData({
      direction: "up"
    });
    const retryableConflict = Object.assign(new Error("serialization conflict"), {
      code: "P2034"
    });

    mocks.prisma.skillVote.findUnique.mockResolvedValueOnce(null);
    mocks.prisma.skillVote.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    mocks.prisma.$transaction
      .mockImplementationOnce(async () => {
        throw retryableConflict;
      })
      .mockImplementationOnce(async (handler: (tx: typeof mocks.prisma) => Promise<unknown>) => handler(mocks.prisma as never));

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(mocks.prisma.$transaction).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
    expect(mocks.prisma.$transaction).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
    expect(mocks.prisma.skillVote.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=voted");
  });
});
