import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6 rounded-[34px] border border-line bg-white/70 p-8 sm:p-10">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-signal">公开发布平台</p>
          <h2 className="text-4xl leading-tight text-ink sm:text-5xl">
            <span className="font-[var(--font-display)] italic">Gauss Skills Hub</span>
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-[#3a2b1f]">发现、提交和迭代你的 Skills。</p>
        </div>

        <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
          任何人都可以公开提交 Skill，也可以基于已有 Skill 发布新的说明版本或功能版本。每一次修改都会沉淀为历史记录。
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            提交 Skill
          </Link>
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
          >
            进入技能广场
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[30px] border border-line bg-[#1f1d19] p-6 text-white">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#f2c38f]">发布规则</p>
          <p className="pt-3 text-sm leading-7 text-white/80">
            提交后立即公开。新的版本会自动接替当前展示版本，旧版本保留在历史页中。
          </p>
        </div>

        <div className="rounded-[30px] border border-line bg-[#efe4d4] p-6 text-ink">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">浏览方式</p>
          <p className="pt-3 text-sm leading-7 text-muted">
            你可以按下载量、更新时间或提交时间浏览 Skills，也可以在详情页继续更新说明或发布新版本。
          </p>
        </div>
      </div>
    </section>
  );
}
