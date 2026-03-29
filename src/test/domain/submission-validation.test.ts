import { commentSchema, reviewDraftSchema, reviewIntentSchema, submissionSchema, voteDirectionSchema } from "@/lib/skills/validation";

describe("submission schema", () => {
  it("rejects invalid bundle file types", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.0",
      mode: "new",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "application/pdf",
      coverMimeType: "image/png"
    });

    expect(result.success).toBe(false);
  });

  it("accepts zip bundles and image covers", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.0",
      mode: "release",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "application/zip",
      coverMimeType: "image/webp"
    });

    expect(result.success).toBe(true);
  });

  it("accepts submissions without a cover image", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.0",
      mode: "new",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "application/zip",
      coverMimeType: ""
    });

    expect(result.success).toBe(true);
  });

  it("requires a bundle archive", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.0",
      mode: "release",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "",
      coverMimeType: "image/png"
    });

    expect(result.success).toBe(false);
  });

  it("allows docs mode to reuse an existing bundle without uploading a new file", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.1",
      mode: "docs",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "",
      existingBundlePath: "bundles/demo-skill.zip",
      coverMimeType: "image/png"
    });

    expect(result.success).toBe(true);
  });

  it("still requires a bundle source in docs mode when no existing bundle path is given", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.1",
      mode: "docs",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "",
      existingBundlePath: "",
      coverMimeType: "image/png"
    });

    expect(result.success).toBe(false);
  });

  it("rejects docs mode when the existing bundle path is not under bundles", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.1",
      mode: "docs",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "Ada",
      bundleMimeType: "",
      existingBundlePath: "covers/demo-skill.png",
      coverMimeType: "image/png"
    });

    expect(result.success).toBe(false);
  });

  it("requires submitter names for public publishing", () => {
    const result = submissionSchema.safeParse({
      title: "Demo Skill",
      slug: "demo-skill",
      version: "v1.0.1",
      mode: "new",
      summary: "A short summary long enough for validation.",
      markdownContent: "# Demo\n\nThis is a valid markdown body for the demo skill.",
      submitterName: "   ",
      bundleMimeType: "application/zip",
      coverMimeType: ""
    });

    expect(result.success).toBe(false);
  });
});

describe("community validation", () => {
  it("requires comment author names and content", () => {
    const missingAuthor = commentSchema.safeParse({
      authorName: "   ",
      content: "这是一条足够长的评论内容。"
    });
    const missingContent = commentSchema.safeParse({
      authorName: "Ada",
      content: "   "
    });

    expect(missingAuthor.success).toBe(false);
    expect(missingContent.success).toBe(false);
  });

  it("accepts only up or down vote directions", () => {
    expect(voteDirectionSchema.safeParse("up").success).toBe(true);
    expect(voteDirectionSchema.safeParse("down").success).toBe(true);
    expect(voteDirectionSchema.safeParse("sideways").success).toBe(false);
  });
});

describe("review validation", () => {
  it("rejects publish actions with incomplete editorial content", () => {
    const result = reviewDraftSchema.safeParse({
      title: " ",
      summary: "short",
      markdownContent: "too small"
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown admin review intents", () => {
    const result = reviewIntentSchema.safeParse("ship-it");

    expect(result.success).toBe(false);
  });
});
