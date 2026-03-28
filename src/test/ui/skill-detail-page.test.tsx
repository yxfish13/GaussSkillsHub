import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSkillDetail: vi.fn()
}));

vi.mock("@/lib/skills/queries", () => ({
  getSkillDetail: mocks.getSkillDetail
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
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
  });
});
