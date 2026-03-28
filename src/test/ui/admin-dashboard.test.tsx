import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  listAdminSkillVersions: vi.fn()
}));

vi.mock("@/lib/auth-server", () => ({
  requireAdminSession: mocks.requireAdminSession
}));

vi.mock("@/lib/skills/queries", () => ({
  listAdminSkillVersions: mocks.listAdminSkillVersions
}));

import AdminDashboardPage from "@/app/admin/page";

describe("admin dashboard", () => {
  beforeEach(() => {
    mocks.requireAdminSession.mockResolvedValue({ adminId: "admin-1" });
    mocks.listAdminSkillVersions.mockResolvedValue({
      submitted: [
        {
          id: "version-1",
          title: "Demo Skill",
          slug: "demo",
          version: "v1.0.0",
          status: "submitted",
          submittedAt: new Date().toISOString()
        }
      ],
      approved: [],
      rejected: []
    });
  });

  it("renders the review queue heading", async () => {
    render(await AdminDashboardPage());

    expect(screen.getByText(/review queue/i)).toBeInTheDocument();
    expect(screen.getByText(/demo skill/i)).toBeInTheDocument();
  });
});
