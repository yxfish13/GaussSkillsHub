import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { isBundleUploadPath } from "@/lib/storage";

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

export async function GET(request: Request, { params }: FileRouteProps) {
  const relativePath = params.path.join("/");
  const absolutePath = path.join(uploadsDirectory, relativePath);
  const normalizedUploadsDirectory = `${uploadsDirectory}${path.sep}`;

  if (!absolutePath.startsWith(normalizedUploadsDirectory)) {
    return new Response("Invalid file path.", { status: 400 });
  }

  try {
    const file = await readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const versionId = new URL(request.url).searchParams.get("versionId");

    if (isBundleUploadPath(relativePath)) {
      const version = versionId
        ? await prisma.skillVersion.findFirst({
            where: {
              id: versionId,
              bundlePath: relativePath
            },
            select: {
              id: true,
              skillId: true
            }
          })
        : await prisma.skillVersion.findFirst({
            where: {
              bundlePath: relativePath
            },
            orderBy: {
              createdAt: "desc"
            },
            select: {
              id: true,
              skillId: true
            }
          });

      if (version) {
        await prisma.$transaction([
          prisma.skillVersion.update({
            where: {
              id: version.id
            },
            data: {
              downloadCount: {
                increment: 1
              }
            }
          }),
          prisma.skill.update({
            where: {
              id: version.skillId
            },
            data: {
              totalDownloadCount: {
                increment: 1
              }
            }
          })
        ]);
      }
    }

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
