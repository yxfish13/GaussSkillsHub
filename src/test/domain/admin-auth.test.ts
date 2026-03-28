// @vitest-environment node

import {
  createAdminSessionCookie,
  hashAdminPassword,
  verifyAdminPassword,
  verifyAdminSessionCookie
} from "@/lib/auth";

describe("admin auth helpers", () => {
  it("creates and verifies an admin session token", async () => {
    const token = await createAdminSessionCookie({ adminId: "admin-1" });
    const payload = await verifyAdminSessionCookie(token);

    expect(typeof token).toBe("string");
    expect(payload.adminId).toBe("admin-1");
  });

  it("verifies a bcrypt password hash", async () => {
    const hash = await hashAdminPassword("secret123");

    await expect(verifyAdminPassword("secret123", hash)).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
