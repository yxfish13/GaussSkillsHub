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
        coverImagePath: null,
        totalDownloadCount: 42,
        createdAt: "2026-03-27T00:00:00.000Z",
        updatedAt: "2026-03-28T00:00:00.000Z"
      }
    ]);
  });

  it("renders sort controls and download-oriented skill metadata", async () => {
    render(
      await SkillsPage({
        searchParams: {
          sort: "downloads"
        }
      }),
    );

    expect(screen.getByRole("link", { name: /按下载量排序/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /按更新时间排序/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /按提交时间排序/i })).toBeInTheDocument();
    expect(screen.getByText(/42 次下载/i)).toBeInTheDocument();
  });
});
