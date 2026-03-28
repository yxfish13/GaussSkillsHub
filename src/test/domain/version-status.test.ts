import { archivePreviousStatus, canResubmitStatus } from "@/lib/skills/types";

describe("version status rules", () => {
  it("archives the previous approved version when a new version is approved", () => {
    expect(archivePreviousStatus("approved")).toBe("archived");
  });

  it("allows rejected versions to be resubmitted", () => {
    expect(canResubmitStatus("rejected")).toBe(true);
    expect(canResubmitStatus("approved")).toBe(false);
  });
});
