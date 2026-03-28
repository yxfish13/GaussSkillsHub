import React from "react";
import { loginAdmin } from "@/app/actions/admin";

type AdminLoginPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const message =
    searchParams?.status === "invalid" ? "Invalid username or password." : undefined;

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="rounded-[28px] border border-line bg-white/70 p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Admin Access</p>
        <h1 className="pt-3 text-4xl font-semibold text-ink">
          <span className="font-[var(--font-display)] italic">Review Archive</span>
        </h1>
        <p className="pt-3 text-sm leading-6 text-muted">
          Sign in with the single administrator account to review submissions, edit markdown, and publish approved versions.
        </p>
      </div>

      <form action={loginAdmin} className="space-y-5 rounded-[28px] border border-line bg-[#f7f0e6] p-8">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Username</span>
          <input name="username" className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm" />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Password</span>
          <input
            type="password"
            name="password"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          />
        </label>

        {message ? (
          <div className="rounded-2xl border border-[#d9b3a3] bg-[#fff4ef] px-4 py-3 text-sm text-[#7c3a20]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Enter Admin Archive
        </button>
      </form>
    </section>
  );
}
