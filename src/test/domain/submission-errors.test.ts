import { getRedirectError } from "next/dist/client/components/redirect";
import { shouldCleanupSubmissionArtifacts } from "@/lib/skills/submission-errors";

describe("submission error handling", () => {
  it("does not clean up uploaded files for redirect control flow", () => {
    expect(shouldCleanupSubmissionArtifacts(getRedirectError("/skills/demo", "replace"))).toBe(false);
  });

  it("cleans up uploaded files for ordinary failures", () => {
    expect(shouldCleanupSubmissionArtifacts(new Error("boom"))).toBe(true);
  });
});
