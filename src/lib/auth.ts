import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { getAuthSecretValue } from "@/lib/env";

export const ADMIN_SESSION_COOKIE_NAME = "skills-hub-admin-session";

const adminSessionSchema = z.object({
  adminId: z.string().min(1)
});

export type AdminSessionPayload = z.infer<typeof adminSessionSchema>;

function getAuthSecret() {
  return new TextEncoder().encode(getAuthSecretValue());
}

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyAdminPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createAdminSessionCookie(payload: AdminSessionPayload) {
  const session = adminSessionSchema.parse(payload);

  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export async function verifyAdminSessionCookie(token: string) {
  const verified = await jwtVerify(token, getAuthSecret());

  return adminSessionSchema.parse(verified.payload);
}
