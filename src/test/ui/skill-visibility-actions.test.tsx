import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/community", () => ({
  hideSkillPublicly: "/skills/hide"
}));

import { SkillVisibilityActions } from "@/components/skills/skill-visibility-actions";

describe("skill visibility actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the public hide button", () => {
    render(<SkillVisibilityActions skillId="skill-1" slug="demo" />);

    expect(screen.getByRole("button", { name: "下架这个 Skill" })).toBeInTheDocument();
  });

  it("cancels the public hide submit when confirmation is declined", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<SkillVisibilityActions skillId="skill-1" slug="demo" />);

    const form = screen.getByRole("button", { name: "下架这个 Skill" }).closest("form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    form?.dispatchEvent(submitEvent);

    expect(confirmSpy).toHaveBeenCalled();
    expect(submitEvent.defaultPrevented).toBe(true);
  });
});
