import { z } from "zod";

const coverMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const bundleMimeTypes = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/x-tar",
  "application/gzip"
] as const;

export const submissionSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  version: z.string().trim().min(2).max(32),
  summary: z.string().trim().min(10).max(240),
  markdownContent: z.string().trim().min(20),
  coverMimeType: z
    .string()
    .trim()
    .refine((value) => coverMimeTypes.includes(value as (typeof coverMimeTypes)[number]), {
      message: "Cover image must be a supported image format."
    }),
  bundleMimeType: z
    .string()
    .trim()
    .refine((value) => bundleMimeTypes.includes(value as (typeof bundleMimeTypes)[number]), {
      message: "Bundle file must be a zip-compatible archive."
    }),
  submitterName: z.string().trim().max(80).optional().or(z.literal("")),
  submitterContact: z.string().trim().max(120).optional().or(z.literal(""))
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
