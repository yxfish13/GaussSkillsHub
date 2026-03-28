import { readFile } from "node:fs/promises";
import path from "node:path";

const uploadsDirectory = path.join(process.cwd(), "storage", "uploads");

const mimeTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".gz": "application/gzip",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".tar": "application/x-tar",
  ".webp": "image/webp",
  ".zip": "application/zip"
};

type FileRouteProps = {
  params: {
    path: string[];
  };
};

export async function GET(_request: Request, { params }: FileRouteProps) {
  const relativePath = params.path.join("/");
  const absolutePath = path.join(uploadsDirectory, relativePath);
  const normalizedUploadsDirectory = `${uploadsDirectory}${path.sep}`;

  if (!absolutePath.startsWith(normalizedUploadsDirectory)) {
    return new Response("Invalid file path.", { status: 400 });
  }

  try {
    const file = await readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();

    return new Response(file, {
      headers: {
        "content-type": mimeTypes[extension] ?? "application/octet-stream",
        "cache-control": "public, max-age=60"
      }
    });
  } catch {
    return new Response("File not found.", { status: 404 });
  }
}
