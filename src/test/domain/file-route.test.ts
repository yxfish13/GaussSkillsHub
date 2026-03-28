import { buildPublicFileHref } from "@/lib/storage";

describe("file route helpers", () => {
  it("builds a controlled public file url", () => {
    expect(buildPublicFileHref("covers/demo.png")).toBe("/api/files/covers/demo.png");
  });
});
