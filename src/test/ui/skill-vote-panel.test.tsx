import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/app/actions/community", () => ({
  toggleSkillVote: "/skills/vote"
}));

import { SkillVotePanel } from "@/components/skills/skill-vote-panel";

describe("skill vote panel", () => {
  it("marks the active vote direction and wires hidden fields", () => {
    render(<SkillVotePanel skillId="skill-1" skillSlug="demo" currentVote="up" />);

    const upvoteButton = screen.getByRole("button", { name: "点赞" });
    const downvoteButton = screen.getByRole("button", { name: "点踩" });
    const skillIdInputs = screen.getAllByDisplayValue("skill-1");
    const slugInputs = screen.getAllByDisplayValue("demo");

    expect(upvoteButton).toHaveAttribute("aria-pressed", "true");
    expect(downvoteButton).toHaveAttribute("aria-pressed", "false");
    expect(skillIdInputs).toHaveLength(2);
    expect(slugInputs).toHaveLength(2);
    expect(screen.getByDisplayValue("up")).toBeInTheDocument();
    expect(screen.getByDisplayValue("down")).toBeInTheDocument();
  });
});
