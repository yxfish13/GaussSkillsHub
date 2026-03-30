// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectError = new Error("NEXT_REDIRECT");

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw redirectError;
  }),
  revalidatePath: vi.fn(),
  requireAdminSession: vi.fn(),
  removeStoredFile: vi.fn(),
  prisma: {
    skill: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/lib/auth-server", () => ({
  requireAdminSession: mocks.requireAdminSession
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma
}));

vi.mock("@/lib/storage", () => ({
  removeStoredFile: mocks.removeStoredFile
}));

import { deleteSkillAsAdmin, hideSkillAsAdmin, restoreSkillAsAdmin } from "@/app/actions/admin";

function createAdminSkillFormData(
  overrides?: {
    skillId?: string;
    slug?: string;
    versionId?: string;
  },
) {
  const formData = new FormData();
  formData.set("skillId", overrides?.skillId ?? "skill-1");
  formData.set("slug", overrides?.slug ?? "superpowers");
  formData.set("versionId", overrides?.versionId ?? "version-1");
  return formData;
}

describe("admin skill visibility actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({ adminId: "admin-1" });
    mocks.prisma.skill.findUnique.mockResolvedValue({
      id: "skill-1",
      slug: "superpowers",
      versions: [
        {
          coverImagePath: "covers/superpowers.webp",
          bundlePath: "bundles/superpowers-v1.zip"
        },
        {
          coverImagePath: null,
          bundlePath: "bundles/superpowers-v2.zip"
        }
      ]
    });
  });

  it("hides a skill from the admin review page", async () => {
    const formData = createAdminSkillFormData();

    await expect(hideSkillAsAdmin(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.requireAdminSession).toHaveBeenCalled();
    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        visibility: "hidden"
      }
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills/superpowers");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/versions/version-1");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/versions/version-1?status=hidden");
  });

  it("restores a hidden skill from the admin review page", async () => {
    const formData = createAdminSkillFormData();

    await expect(restoreSkillAsAdmin(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skill.update).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      },
      data: {
        visibility: "public"
      }
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/versions/version-1?status=restored");
  });

  it("deletes a skill and cleans up stored files", async () => {
    const formData = createAdminSkillFormData();

    await expect(deleteSkillAsAdmin(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.prisma.skill.delete).toHaveBeenCalledWith({
      where: {
        id: "skill-1"
      }
    });
    expect(mocks.removeStoredFile).toHaveBeenCalledWith("covers/superpowers.webp");
    expect(mocks.removeStoredFile).toHaveBeenCalledWith("bundles/superpowers-v1.zip");
    expect(mocks.removeStoredFile).toHaveBeenCalledWith("bundles/superpowers-v2.zip");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/skills/superpowers");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin?status=deleted");
  });
});
