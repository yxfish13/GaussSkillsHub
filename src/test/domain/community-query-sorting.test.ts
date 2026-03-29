// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    skill: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    skillVote: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma
}));

import { getSkillDetail, listLatestApprovedSkills } from "@/lib/skills/queries";

describe("community query sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses upvotes as the default catalogue sort", async () => {
    mocks.prisma.skill.findMany.mockResolvedValueOnce([]);

    await listLatestApprovedSkills();

    expect(mocks.prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { totalUpvoteCount: "desc" },
          { totalDownloadCount: "desc" },
          { latestApprovedVersion: { updatedAt: "desc" } },
          { createdAt: "desc" },
          { id: "asc" }
        ]
      }),
    );
  });

  it("supports downvote sorting", async () => {
    mocks.prisma.skill.findMany.mockResolvedValueOnce([]);

    await listLatestApprovedSkills(undefined, "downvotes");

    expect(mocks.prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { totalDownvoteCount: "desc" },
          { totalDownloadCount: "desc" },
          { latestApprovedVersion: { updatedAt: "desc" } },
          { createdAt: "desc" },
          { id: "asc" }
        ]
      }),
    );
  });

  it("supports deterministic download sorting", async () => {
    mocks.prisma.skill.findMany.mockResolvedValueOnce([]);

    await listLatestApprovedSkills(undefined, "downloads");

    expect(mocks.prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { totalDownloadCount: "desc" },
          { latestApprovedVersion: { updatedAt: "desc" } },
          { createdAt: "desc" },
          { id: "asc" }
        ]
      }),
    );
  });

  it("uses the latest approved release timestamp for updated sorting", async () => {
    mocks.prisma.skill.findMany.mockResolvedValueOnce([]);

    await listLatestApprovedSkills(undefined, "updated");

    expect(mocks.prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ latestApprovedVersion: { updatedAt: "desc" } }, { createdAt: "desc" }, { id: "asc" }]
      }),
    );
  });

  it("searches by slug, title, summary, and submitter name", async () => {
    mocks.prisma.skill.findMany.mockResolvedValueOnce([]);

    await listLatestApprovedSkills("ada");

    const call = mocks.prisma.skill.findMany.mock.calls[0][0];
    const where = call.where as { OR: Array<Record<string, unknown>> };

    expect(where.OR).toEqual(
      expect.arrayContaining([
        {
          slug: {
            contains: "ada",
            mode: "insensitive"
          }
        },
        {
          latestApprovedVersion: {
            is: {
              title: {
                contains: "ada",
                mode: "insensitive"
              }
            }
          }
        },
        {
          latestApprovedVersion: {
            is: {
              summary: {
                contains: "ada",
                mode: "insensitive"
              }
            }
          }
        },
        {
          latestApprovedVersion: {
            is: {
              submitterName: {
                contains: "ada",
                mode: "insensitive"
              }
            }
          }
        }
      ]),
    );
  });

  it("returns vote totals, submitter fallback, comments, and current viewer vote", async () => {
    const now = new Date("2026-03-29T10:00:00.000Z");
    const earlier = new Date("2026-03-28T10:00:00.000Z");
    const voteTouchedAt = new Date("2026-03-30T10:00:00.000Z");

    mocks.prisma.skill.findUnique.mockResolvedValueOnce({
      id: "skill-1",
      slug: "superpowers",
      createdAt: earlier,
      updatedAt: voteTouchedAt,
      totalDownloadCount: 10,
      totalUpvoteCount: 6,
      totalDownvoteCount: 2,
      latestApprovedVersion: {
        id: "version-2",
        version: "v1.0.1",
        title: "Superpowers",
        summary: "Latest summary",
        markdownContent: "# Latest",
        downloadCount: 4,
        bundlePath: "bundles/superpowers.zip",
        bundleName: "superpowers.zip",
        coverImagePath: null,
        submitterName: "Ada",
        createdAt: now,
        updatedAt: now
      },
      versions: [
        {
          id: "version-1",
          version: "v1.0.0",
          title: "Superpowers",
          summary: "Initial summary",
          markdownContent: "# Initial",
          downloadCount: 6,
          bundlePath: "bundles/superpowers.zip",
          bundleName: "superpowers.zip",
          coverImagePath: null,
          submitterName: null,
          createdAt: earlier,
          updatedAt: earlier
        },
        {
          id: "version-2",
          version: "v1.0.1",
          title: "Superpowers",
          summary: "Latest summary",
          markdownContent: "# Latest",
          downloadCount: 4,
          bundlePath: "bundles/superpowers.zip",
          bundleName: "superpowers.zip",
          coverImagePath: null,
          submitterName: "Ada",
          createdAt: now,
          updatedAt: now
        }
      ],
      comments: [
        {
          id: "comment-2",
          authorName: "Grace",
          content: "Second comment",
          createdAt: now
        },
        {
          id: "comment-1",
          authorName: "Linus",
          content: "First comment",
          createdAt: earlier
        }
      ]
    });
    mocks.prisma.skillVote.findUnique.mockResolvedValueOnce({
      id: "vote-1",
      value: "down"
    });

    const detail = await getSkillDetail("superpowers", "v1.0.0", "hashed-browser-token");

    expect(mocks.prisma.skill.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          comments: expect.objectContaining({
            orderBy: {
              createdAt: "desc"
            }
          })
        })
      }),
    );
    expect(mocks.prisma.skillVote.findUnique).toHaveBeenCalledWith({
      where: {
        skillId_browserTokenHash: {
          skillId: "skill-1",
          browserTokenHash: "hashed-browser-token"
        }
      },
      select: {
        value: true
      }
    });
    expect(detail?.skill.totalUpvoteCount).toBe(6);
    expect(detail?.skill.totalDownvoteCount).toBe(2);
    expect(detail?.skill.updatedAt).toBe(now.toISOString());
    expect(detail?.selectedVersion.submitterName).toBe("未署名");
    expect(detail?.comments.map((comment) => comment.id)).toEqual(["comment-2", "comment-1"]);
    expect(detail?.currentViewerVote).toBe("down");
  });
});
