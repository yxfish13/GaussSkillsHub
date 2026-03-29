import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/app/actions/community", () => ({
  submitSkillComment: "/skills/comment"
}));

import { SkillCommentForm } from "@/components/skills/skill-comment-form";

describe("skill comment form", () => {
  it("renders required author and comment fields", () => {
    render(<SkillCommentForm skillId="skill-1" skillSlug="demo-skill" />);

    expect(screen.getByLabelText("姓名")).toBeRequired();
    expect(screen.getByLabelText("评论内容")).toBeRequired();
    expect(screen.getByDisplayValue("skill-1")).toHaveAttribute("type", "hidden");
    expect(screen.getByDisplayValue("demo-skill")).toHaveAttribute("type", "hidden");
    expect(screen.getByRole("button", { name: "发表评论" })).toBeInTheDocument();
  });
});
