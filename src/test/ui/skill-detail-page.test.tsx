import React from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSkillDetail: vi.fn(),
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => (name === "gauss-skills-browser-token" ? { value: "demo-browser-token" } : undefined))
  }))
}));

vi.mock("@/lib/skills/queries", () => ({
  getSkillDetail: mocks.getSkillDetail
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies
}));

vi.mock("@/app/actions/community", () => ({
  toggleSkillVote: "/skills/vote",
  submitSkillComment: "/skills/comment",
  hideSkillPublicly: "/skills/hide"
}));

import SkillDetailPage from "@/app/skills/[slug]/page";

describe("skill detail page", () => {
  beforeEach(() => {
    mocks.getSkillDetail.mockResolvedValue({
      skill: {
        id: "skill-1",
        slug: "demo",
        createdAt: new Date("2026-03-20").toISOString(),
        updatedAt: new Date("2026-03-28").toISOString(),
        totalUpvoteCount: 12,
        totalDownvoteCount: 3,
        totalDownloadCount: 24
      },
      selectedVersion: {
        id: "version-1",
        version: "v1.0.0",
        title: "Demo Skill",
        summary: "A compact summary for the demo skill.",
        markdownContent: "# Demo Skill\n\nRendered body.",
        downloadCount: 7,
        bundlePath: "bundles/demo.zip",
        bundleName: "demo.zip",
        coverImagePath: null,
        submitterName: "Ada",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      comments: [
        {
          id: "comment-2",
          authorName: "Grace",
          content: "第二条评论",
          createdAt: new Date("2026-03-29").toISOString()
        },
        {
          id: "comment-1",
          authorName: "Linus",
          content: "第一条评论",
          createdAt: new Date("2026-03-28").toISOString()
        }
      ],
      currentViewerVote: "up",
      approvedVersions: [
        {
          id: "version-1",
          version: "v1.0.0",
          title: "Demo Skill"
        }
      ]
    });
  });

  it("renders markdown content and version metadata", async () => {
    render(
      await SkillDetailPage({
        params: {
          slug: "demo"
        },
        searchParams: {
          version: "v1.0.0"
        }
      }),
    );

    expect(screen.getAllByRole("heading", { name: /demo skill/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/v1.0.0/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/rendered body/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /更新说明/i })).toHaveAttribute(
      "href",
      "/submit?from=demo&base=v1.0.0&mode=docs",
    );
    expect(screen.getByRole("link", { name: /发布新版本/i })).toHaveAttribute(
      "href",
      "/submit?from=demo&base=v1.0.0&mode=release",
    );
    expect(screen.getByText(/7 次下载/i)).toBeInTheDocument();
    expect(screen.getByText(/发布者 Ada/i)).toBeInTheDocument();
    expect(screen.getByText(/12 赞/i)).toBeInTheDocument();
    expect(screen.getByText(/3 踩/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /点赞/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /点踩/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下架这个 Skill" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /社区讨论/i })).toBeInTheDocument();
    expect(screen.getByLabelText("姓名")).toBeInTheDocument();
    expect(screen.getByLabelText("评论内容")).toBeInTheDocument();
    const commentList = screen.getByRole("list", { name: "评论列表" });
    const comments = within(commentList).getAllByRole("listitem");
    expect(comments).toHaveLength(2);
    expect(comments[0]).toHaveTextContent("第二条评论");
    expect(comments[1]).toHaveTextContent("第一条评论");
    expect(mocks.getSkillDetail).toHaveBeenCalledWith(
      "demo",
      "v1.0.0",
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });
});
