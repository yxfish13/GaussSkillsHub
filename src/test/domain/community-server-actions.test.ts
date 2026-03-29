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
    skillVote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    skill: {
      update: vi.fn()
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

import { submitSkillComment, toggleSkillVote } from "@/app/actions/community";

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

describe("community server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (handler: (tx: typeof mocks.prisma) => Promise<unknown>) =>
      handler(mocks.prisma as never),
    );
    mocks.getOrCreateSkillBrowserTokenHash.mockResolvedValue("hashed-browser-token");
  });

  it("rejects invalid comments with commentSchema and does not create rows", async () => {
    const formData = createCommentFormData({
      authorName: "   "
    });

    await expect(submitSkillComment(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillComment.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=invalid-comment");
  });

  it("creates comments and revalidates catalogue and detail paths", async () => {
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
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=commented");
  });

  it("creates a new upvote when no prior vote exists", async () => {
    const formData = createVoteFormData({
      direction: "up"
    });
    mocks.prisma.skillVote.findUnique.mockResolvedValueOnce(null);

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.getOrCreateSkillBrowserTokenHash).toHaveBeenCalled();
    expect(mocks.prisma.skillVote.create).toHaveBeenCalledWith({
      data: {
        skillId: "skill-1",
        browserTokenHash: "hashed-browser-token",
        value: "up"
      }
    });
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        totalUpvoteCount: {
          increment: 1
        },
        totalDownvoteCount: {
          increment: 0
        }
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

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillVote.delete).toHaveBeenCalledWith({
      where: {
        id: "vote-1"
      }
    });
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        totalUpvoteCount: {
          increment: 0
        },
        totalDownvoteCount: {
          increment: -1
        }
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

    await expect(toggleSkillVote(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skillVote.update).toHaveBeenCalledWith({
      where: {
        id: "vote-1"
      },
      data: {
        value: "down"
      }
    });
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        totalUpvoteCount: {
          increment: -1
        },
        totalDownvoteCount: {
          increment: 1
        }
      }
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills/superpowers");
    expect(mocks.redirect).toHaveBeenCalledWith("/skills/superpowers?status=voted");
  });
});
