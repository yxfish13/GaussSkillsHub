"use client";

import React from "react";
import { submitSkillVersion } from "@/app/actions/submissions";
import type { SkillSubmissionPrefill } from "@/lib/skills/queries";

type SkillSubmissionFormProps = {
  status?: string;
  mode?: "new" | "docs" | "release";
  prefill?: SkillSubmissionPrefill;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "success":
      return "提交成功，Skill 已经公开发布。";
    case "duplicate":
      return "这个版本号已经存在，请使用新的版本号。";
    case "invalid":
      return "请补全必填信息，并上传有效的附件。";
    case "error":
      return "当前暂时无法完成发布，请稍后重试。";
    default:
      return null;
  }
}

function getSubmitButtonLabel(mode: SkillSubmissionFormProps["mode"]) {
  if (mode === "docs") {
    return "发布说明版本";
  }

  if (mode === "release") {
    return "发布新版本";
  }

  return "立即发布";
}

export function SkillSubmissionForm({ mode = "new", prefill, status }: SkillSubmissionFormProps) {
  const message = getStatusMessage(status);
  const bundleRequired = mode !== "docs" || !prefill?.existingBundlePath;
  const baseVersion = prefill?.version;

  return (
    <form action={submitSkillVersion} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="existingBundlePath" value={prefill?.existingBundlePath ?? ""} />

      <div className="space-y-5 rounded-[28px] border border-line bg-white/70 p-6">
        {baseVersion ? (
          <div className="rounded-[24px] border border-line bg-[#fcfaf7] px-4 py-3 text-sm text-muted">
            {mode === "docs"
              ? `你正在基于 ${baseVersion} 更新说明，发布后会生成一个新版本。`
              : `你正在基于 ${baseVersion} 发布新版本，旧版本会保留在历史记录中。`}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span className="flex items-center justify-between gap-3">
              <span>技能名称</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">必填</span>
            </span>
            <input
              name="title"
              aria-label="技能名称"
              defaultValue={prefill?.title ?? ""}
              required
              minLength={2}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="例如：Superpowers"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-ink">
            <span className="flex items-center justify-between gap-3">
              <span>唯一标识</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">必填</span>
            </span>
            <input
              name="slug"
              aria-label="唯一标识"
              defaultValue={prefill?.slug ?? ""}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              readOnly={Boolean(prefill?.slug)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="例如：superpowers"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span className="flex items-center justify-between gap-3">
              <span>版本号</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">必填</span>
            </span>
            <input
              name="version"
              aria-label="版本号"
              required
              minLength={2}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder={baseVersion ? `基于 ${baseVersion}，例如 v1.0.1` : "例如 v1.0.0"}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-ink">
            <span>提交者</span>
            <input
              name="submitterName"
              aria-label="提交者"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="可选"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>一句话简介</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">必填</span>
          </span>
          <textarea
            name="summary"
            aria-label="一句话简介"
            defaultValue={prefill?.summary ?? ""}
            required
            minLength={10}
            className="min-h-[110px] w-full rounded-[24px] border border-line bg-white px-4 py-3 text-sm"
            placeholder="用一句话说明这个 Skill 的用途和价值。"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>详细介绍（Markdown）</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">必填</span>
          </span>
          <textarea
            name="markdownContent"
            aria-label="详细介绍（Markdown）"
            defaultValue={prefill?.markdownContent ?? ""}
            required
            minLength={20}
            className="min-h-[280px] w-full rounded-[24px] border border-line bg-white px-4 py-3 font-mono text-sm"
            placeholder={"# Skill 标题\n\n介绍安装方式、使用方法和示例。"}
          />
        </label>
      </div>

      <div className="space-y-5 rounded-[28px] border border-line bg-[#f7f0e6] p-6">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>封面图</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">可选</span>
          </span>
          <input
            type="file"
            name="coverImage"
            aria-label="封面图"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-sm text-muted"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>技能压缩包</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
              {bundleRequired ? "必填" : "可复用"}
            </span>
          </span>
          <input
            type="file"
            name="bundle"
            aria-label="技能压缩包"
            required={bundleRequired}
            accept=".zip,.tar,.gz"
            className="block w-full text-sm text-muted"
          />
        </label>

        {prefill?.existingBundleName ? (
          <div className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-muted">
            当前将沿用附件：{prefill.existingBundleName}
          </div>
        ) : null}

        <label className="space-y-2 text-sm font-medium text-ink">
          <span>联系方式</span>
          <input
            name="submitterContact"
            aria-label="联系方式"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            placeholder="邮箱 / GitHub / 微信"
          />
        </label>

        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status === "success"
                ? "border-[#9fc68b] bg-[#edf7e7] text-[#1f4d1d]"
                : "border-[#d9b3a3] bg-[#fff4ef] text-[#7c3a20]"
            }`}
          >
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {getSubmitButtonLabel(mode)}
        </button>
      </div>
    </form>
  );
}
