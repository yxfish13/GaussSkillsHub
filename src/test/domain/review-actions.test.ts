import { applyReviewDecision } from "@/lib/skills/service";

describe("review actions", () => {
  it("marks the previous approved version for archiving when a new version is approved", async () => {
    const result = await applyReviewDecision({
      currentApprovedVersionId: "previous-version",
      targetVersionId: "next-version",
      decision: "approved"
    });

    expect(result.archivePrevious).toBe(true);
  });

  it("requires a note when rejecting a version", async () => {
    await expect(
      applyReviewDecision({
        currentApprovedVersionId: null,
        targetVersionId: "next-version",
        decision: "rejected",
        reviewNote: ""
      }),
    ).rejects.toThrow(/review note/i);
  });
});
