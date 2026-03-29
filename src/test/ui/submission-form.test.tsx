import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicSkillVersionPrefill: vi.fn()
}));

vi.mock("@/app/actions/submissions", () => ({
  submitSkillVersion: "/submit"
}));

vi.mock("@/lib/skills/queries", () => ({
  getPublicSkillVersionPrefill: mocks.getPublicSkillVersionPrefill
}));

import SubmitPage from "@/app/submit/page";

describe("submit page", () => {
  beforeEach(() => {
    mocks.getPublicSkillVersionPrefill.mockResolvedValue({
      slug: "superpowers",
      version: "v1.0.0",
      title: "Superpowers",
      summary: "这是一个足够长的简介，用于测试说明更新时的预填内容。",
      markdownContent: "# Superpowers\n\n这里是用于测试的正文内容，长度足够。",
      existingBundlePath: "bundles/superpowers.zip",
      existingBundleName: "superpowers.zip",
      existingCoverImagePath: "covers/superpowers.png"
    });
  });

  it("renders Chinese labels and prefilled docs mode content", async () => {
    render(
      await SubmitPage({
        searchParams: {
          from: "superpowers",
          base: "v1.0.0",
          mode: "docs"
        }
      }),
    );

    expect(screen.getByLabelText(/技能名称/i)).toBeRequired();
    expect(screen.getByDisplayValue("superpowers")).toBeInTheDocument();
    expect(screen.getByText(/你正在基于 v1.0.0 更新说明/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Superpowers")).toBeInTheDocument();
    expect(screen.getByLabelText(/提交者/i)).toBeRequired();
    expect(screen.getByLabelText(/提交者/i)).toHaveAttribute("placeholder", "例如 Ada");
    expect(screen.getByLabelText(/技能压缩包/i)).not.toBeRequired();
    expect(screen.getByLabelText(/唯一标识/i)).toHaveAttribute("pattern", "[a-z0-9]+(-[a-z0-9]+)*");
    expect(screen.getByDisplayValue("bundles/superpowers.zip")).toHaveAttribute("type", "hidden");
  });
});
