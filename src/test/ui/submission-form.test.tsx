import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/app/actions/submissions", () => ({
  submitSkillVersion: "/submit"
}));

import SubmitPage from "@/app/submit/page";

describe("submit page", () => {
  it("renders the required content and file fields", () => {
    render(<SubmitPage />);

    expect(screen.getByLabelText(/skill name/i)).toBeRequired();
    expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toHaveAttribute("pattern", "[a-z0-9]+(-[a-z0-9]+)*");
    expect(screen.getByLabelText(/cover image/i)).not.toBeRequired();
    expect(screen.getByLabelText(/bundle zip/i)).toBeRequired();
  });
});
