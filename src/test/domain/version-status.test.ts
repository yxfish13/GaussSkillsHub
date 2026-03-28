import {
  archivePreviousStatus,
  canResubmitStatus,
  isPublicSkillVersionStatus
} from "@/lib/skills/types";

describe("version status rules", () => {
  it("archives the previous approved version when a new version is approved", () => {
    expect(archivePreviousStatus("approved")).toBe("archived");
  });

  it("allows rejected versions to be resubmitted", () => {
    expect(canResubmitStatus("rejected")).toBe(true);
    expect(canResubmitStatus("approved")).toBe(false);
  });

  it("treats approved and archived versions as public", () => {
    expect(isPublicSkillVersionStatus("approved")).toBe(true);
    expect(isPublicSkillVersionStatus("archived")).toBe(true);
    expect(isPublicSkillVersionStatus("submitted")).toBe(false);
  });
});
