import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookie,
  verifyAdminSessionCookie
} from "@/lib/auth";

export async function getAdminSession() {
  const token = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAdminSessionCookie(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function persistAdminSession(adminId: string) {
  const token = await createAdminSessionCookie({ adminId });

  cookies().set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAdminSession() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
}
