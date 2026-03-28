import { buildPublicFileHref, isBundleUploadPath } from "@/lib/storage";

describe("file route helpers", () => {
  it("builds a controlled public file url", () => {
    expect(buildPublicFileHref("covers/demo.png")).toBe("/api/files/covers/demo.png");
  });

  it("can attach a version id to bundle download urls", () => {
    expect(buildPublicFileHref("bundles/demo.zip", "version-1")).toBe("/api/files/bundles/demo.zip?versionId=version-1");
  });

  it("identifies bundle upload paths", () => {
    expect(isBundleUploadPath("bundles/demo.zip")).toBe(true);
    expect(isBundleUploadPath("covers/demo.png")).toBe(false);
  });
});
