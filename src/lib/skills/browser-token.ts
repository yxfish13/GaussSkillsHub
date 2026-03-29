import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export const SKILL_BROWSER_TOKEN_COOKIE_NAME = "gauss-skills-browser-token";

export function hashSkillBrowserToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getOrCreateSkillBrowserTokenHash() {
  const cookieStore = cookies();
  const existingToken = cookieStore.get(SKILL_BROWSER_TOKEN_COOKIE_NAME)?.value;
  const token = existingToken ?? randomUUID();

  if (!existingToken) {
    cookieStore.set(SKILL_BROWSER_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  return hashSkillBrowserToken(token);
}
