"use client";

import React from "react";
import { deleteSkillAsAdmin, hideSkillAsAdmin, restoreSkillAsAdmin } from "@/app/actions/admin";

type AdminSkillControlsProps = {
  skillId: string;
  slug: string;
  versionId: string;
  visibility: "public" | "hidden";
};

export function AdminSkillControls({ skillId, slug, versionId, visibility }: AdminSkillControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-line bg-white/70 p-4">
      {visibility === "public" ? (
        <form
          action={hideSkillAsAdmin}
          onSubmit={(event) => {
            if (!window.confirm("确认下架后，这个 Skill 将从公开站点隐藏。")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="skillId" value={skillId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="versionId" value={versionId} />
          <button
            type="submit"
            className="rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-500 hover:bg-amber-100"
          >
            下架 Skill
          </button>
        </form>
      ) : (
        <form
          action={restoreSkillAsAdmin}
          onSubmit={(event) => {
            if (!window.confirm("确认恢复后，这个 Skill 会重新出现在公开站点。")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="skillId" value={skillId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="versionId" value={versionId} />
          <button
            type="submit"
            className="rounded-full border border-emerald-400 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-500 hover:bg-emerald-100"
          >
            恢复 Skill
          </button>
        </form>
      )}

      <form
        action={deleteSkillAsAdmin}
        onSubmit={(event) => {
          if (!window.confirm("删除后将同时移除版本、评论、点赞和上传文件，此操作不可恢复。")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="skillId" value={skillId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="versionId" value={versionId} />
        <button
          type="submit"
          className="rounded-full border border-rose-400 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-500 hover:bg-rose-100"
        >
          删除 Skill
        </button>
      </form>
    </div>
  );
}
