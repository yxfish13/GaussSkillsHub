import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/admin", () => ({
  hideSkillAsAdmin: "/admin/skills/hide",
  restoreSkillAsAdmin: "/admin/skills/restore",
  deleteSkillAsAdmin: "/admin/skills/delete"
}));

import { AdminSkillControls } from "@/components/admin/admin-skill-controls";

describe("admin skill controls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders hide and delete controls for public skills", () => {
    render(<AdminSkillControls skillId="skill-1" slug="demo" versionId="version-1" visibility="public" />);

    expect(screen.getByRole("button", { name: "下架 Skill" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "恢复 Skill" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 Skill" })).toBeInTheDocument();
  });

  it("renders restore and delete controls for hidden skills", () => {
    render(<AdminSkillControls skillId="skill-1" slug="demo" versionId="version-1" visibility="hidden" />);

    expect(screen.queryByRole("button", { name: "下架 Skill" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "恢复 Skill" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 Skill" })).toBeInTheDocument();
  });

  it("cancels submission when the admin rejects the confirmation prompt", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<AdminSkillControls skillId="skill-1" slug="demo" versionId="version-1" visibility="public" />);

    const form = screen.getByRole("button", { name: "删除 Skill" }).closest("form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    form?.dispatchEvent(submitEvent);

    expect(confirmSpy).toHaveBeenCalled();
    expect(submitEvent.defaultPrevented).toBe(true);
  });
});
