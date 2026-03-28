import { preparePublicReleaseTransition } from "@/lib/skills/service";

describe("public release actions", () => {
  it("archives the previous latest version when publishing a new version", async () => {
    const result = await preparePublicReleaseTransition({
      currentApprovedVersionId: "previous-version",
      targetVersionId: "next-version"
    });

    expect(result.archivePrevious).toBe(true);
    expect(result.nextStatus).toBe("approved");
  });

  it("does not archive when there is no previously published version", async () => {
    const result = await preparePublicReleaseTransition({
      currentApprovedVersionId: null,
      targetVersionId: "first-version"
    });

    expect(result.archivePrevious).toBe(false);
    expect(result.nextStatus).toBe("approved");
  });
});
