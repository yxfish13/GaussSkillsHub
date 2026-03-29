import { z } from "zod";

const coverMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const bundleMimeTypes = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/x-tar",
  "application/gzip"
] as const;

const titleSchema = z.string().trim().min(2).max(120);
const summarySchema = z.string().trim().min(10).max(240);
const markdownContentSchema = z.string().trim().min(20);
const submissionModeSchema = z.enum(["new", "docs", "release"]);
const nameSchema = z.string().trim().min(1).max(80);
const commentContentSchema = z.string().trim().min(1).max(1000);

export const reviewDraftSchema = z.object({
  title: titleSchema,
  summary: summarySchema,
  markdownContent: markdownContentSchema
});

export const reviewIntentSchema = z.enum(["save", "approve", "reject", "resubmit"]);
export const voteDirectionSchema = z.enum(["up", "down"]);
export const commentSchema = z.object({
  authorName: nameSchema,
  content: commentContentSchema
});

export const submissionSchema = reviewDraftSchema.extend({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  version: z.string().trim().min(2).max(32),
  mode: submissionModeSchema.default("new"),
  existingBundlePath: z
    .string()
    .trim()
    .max(255)
    .refine((value) => !value || /^bundles\/.+/.test(value), {
      message: "Existing bundle path must reference a published bundle."
    })
    .optional()
    .or(z.literal("")),
  coverMimeType: z
    .string()
    .trim()
    .refine((value) => !value || coverMimeTypes.includes(value as (typeof coverMimeTypes)[number]), {
      message: "Cover image must be a supported image format."
  }),
  bundleMimeType: z.string().trim(),
  submitterName: nameSchema,
  submitterContact: z.string().trim().max(120).optional().or(z.literal(""))
}).superRefine((value, context) => {
  const hasBundleUpload = bundleMimeTypes.includes(value.bundleMimeType as (typeof bundleMimeTypes)[number]);
  const hasExistingBundlePath = Boolean(value.existingBundlePath?.trim());
  const requiresUploadedBundle = value.mode === "new" || value.mode === "release";

  if (requiresUploadedBundle && !hasBundleUpload) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bundleMimeType"],
      message: "Bundle file must be a zip-compatible archive."
    });
  }

  if (!requiresUploadedBundle && !hasBundleUpload && !hasExistingBundlePath) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bundleMimeType"],
      message: "Bundle file must be a zip-compatible archive."
    });
  }
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type VoteDirectionInput = z.infer<typeof voteDirectionSchema>;
