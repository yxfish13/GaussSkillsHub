import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadRoots = {
  cover: "covers",
  bundle: "bundles"
} as const;

export type UploadKind = keyof typeof uploadRoots;

const uploadsDirectory = path.join(process.cwd(), "storage", "uploads");

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export async function ensureUploadDirectory(kind: UploadKind) {
  const directory = path.join(uploadsDirectory, uploadRoots[kind]);
  await mkdir(directory, { recursive: true });

  return directory;
}

export async function saveUpload(file: File, kind: UploadKind) {
  const directory = await ensureUploadDirectory(kind);
  const extension = path.extname(file.name) || (kind === "cover" ? ".bin" : ".zip");
  const baseName = sanitizeFileName(path.basename(file.name, extension)) || kind;
  const fileName = `${Date.now()}-${randomUUID()}-${baseName}${extension.toLowerCase()}`;
  const relativePath = path.posix.join(uploadRoots[kind], fileName);
  const absolutePath = path.join(directory, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, bytes);

  return {
    path: relativePath,
    originalName: file.name,
    size: bytes.byteLength
  };
}

export function buildPublicFileHref(relativePath: string) {
  return `/api/files/${relativePath.replaceAll("\\", "/")}`;
}

export async function removeStoredFile(relativePath?: string | null) {
  if (!relativePath) {
    return;
  }

  const absolutePath = path.join(uploadsDirectory, relativePath);
  await rm(absolutePath, { force: true });
}
