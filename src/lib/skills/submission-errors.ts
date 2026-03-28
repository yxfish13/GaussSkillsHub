import { isRedirectError } from "next/dist/client/components/redirect";

export function shouldCleanupSubmissionArtifacts(error: unknown) {
  return !isRedirectError(error);
}
