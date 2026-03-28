import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/app/actions/admin", () => ({
  submitAdminReviewAction: "/admin/review"
}));

import { ReviewEditor } from "@/components/admin/review-editor";

describe("review editor", () => {
  it("uses client-side validation for publish and reject actions", () => {
    render(
      <ReviewEditor
        version={{
          id: "version-1",
          title: "Demo Skill",
          summary: "A compact summary for the demo skill.",
          markdownContent: "# Demo Skill\n\nRendered body content for publishing.",
          version: "v1.0.0",
          status: "submitted",
          reviewNotes: null,
          bundleName: "demo.zip",
          submitterName: "Ada",
          submitterContact: "ada@example.com",
          submittedAt: new Date().toISOString(),
          slug: "demo-skill"
        }}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toBeRequired();
    expect(screen.getByLabelText(/summary/i)).toBeRequired();
    expect(screen.getByLabelText(/markdown content/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /save draft/i })).toHaveAttribute("formnovalidate");
    expect(screen.getByLabelText(/review note/i)).not.toBeRequired();

    fireEvent.mouseDown(screen.getByRole("button", { name: /reject/i }));

    expect(screen.getByLabelText(/review note/i)).toBeRequired();
  });
});
