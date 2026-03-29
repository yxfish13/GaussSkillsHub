import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listLatestApprovedSkills: vi.fn()
}));

vi.mock("@/lib/skills/queries", () => ({
  listLatestApprovedSkills: mocks.listLatestApprovedSkills
}));

import SkillsPage from "@/app/skills/page";

describe("skills page", () => {
  beforeEach(() => {
    mocks.listLatestApprovedSkills.mockResolvedValue([
      {
        id: "skill-1",
        slug: "superpowers",
        title: "Superpowers",
        summary: "用于测试技能广场卡片的简介内容，长度足够。",
        version: "v1.2.0",
        submitterName: "Ada",
        coverImagePath: null,
        totalUpvoteCount: 120,
        totalDownvoteCount: 4,
        totalDownloadCount: 42,
        createdAt: "2026-03-27T00:00:00.000Z",
        updatedAt: "2026-03-28T00:00:00.000Z"
      }
    ]);
  });

  it("renders a compact list row with search and community sorting", async () => {
    render(
      await SkillsPage({
        searchParams: {
          sort: "upvotes",
          q: "super"
        }
      }),
    );

    expect(screen.getByRole("searchbox", { name: /检索 skills/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /搜索/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /按点赞排序/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /按点踩排序/i })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /skills 列表/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /查看 superpowers 详情/i })).toBeInTheDocument();
    expect(screen.getByText(/发布者 Ada/i)).toBeInTheDocument();
    expect(screen.getByText(/120 赞/i)).toBeInTheDocument();
    expect(screen.getByText(/4 踩/i)).toBeInTheDocument();
    expect(screen.getByText(/42 次下载/i)).toBeInTheDocument();
  });

  it("shows search-specific empty state copy when no result matches", async () => {
    mocks.listLatestApprovedSkills.mockResolvedValueOnce([]);

    render(
      await SkillsPage({
        searchParams: {
          sort: "upvotes",
          q: "missing"
        }
      }),
    );

    expect(screen.getByText(/没有找到匹配的 Skills/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /按点赞排序/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /按下载量排序/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /按更新时间排序/i })).toBeInTheDocument();
  });
});
