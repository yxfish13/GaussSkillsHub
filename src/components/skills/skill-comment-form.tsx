import React from "react";
import { submitSkillComment } from "@/app/actions/community";

type SkillCommentFormProps = {
  skillId: string;
  skillSlug: string;
};

export function SkillCommentForm({ skillId, skillSlug }: SkillCommentFormProps) {
  return (
    <form action={submitSkillComment} className="space-y-3 rounded-2xl border border-line bg-white/80 p-4">
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="slug" value={skillSlug} />

      <label className="block space-y-2 text-sm font-medium text-ink">
        <span>姓名</span>
        <input
          name="authorName"
          aria-label="姓名"
          required
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          placeholder="请输入你的姓名"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-ink">
        <span>评论内容</span>
        <textarea
          name="content"
          aria-label="评论内容"
          required
          rows={4}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          placeholder="写下你的使用反馈或建议"
        />
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        发表评论
      </button>
    </form>
  );
}
