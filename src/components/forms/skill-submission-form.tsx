"use client";

import React from "react";
import { submitSkillVersion } from "@/app/actions/submissions";

type SkillSubmissionFormProps = {
  status?: string;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "success":
      return "Submission received. It is now waiting for admin review.";
    case "duplicate":
      return "That version already exists for this skill. Use a new version number.";
    case "invalid":
      return "Please complete all required fields and upload valid files.";
    case "error":
      return "Unable to save the submission right now.";
    default:
      return null;
  }
}

export function SkillSubmissionForm({ status }: SkillSubmissionFormProps) {
  const message = getStatusMessage(status);

  return (
    <form action={submitSkillVersion} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5 rounded-[28px] border border-line bg-white/70 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span className="flex items-center justify-between gap-3">
              <span>Skill Name</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
            </span>
            <input
              name="title"
              aria-label="Skill Name"
              required
              minLength={2}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="Gauss Workflow"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-ink">
            <span className="flex items-center justify-between gap-3">
              <span>Slug</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
            </span>
            <input
              name="slug"
              aria-label="Slug"
              required
              pattern="[a-z0-9-]+"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="gauss-workflow"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span className="flex items-center justify-between gap-3">
              <span>Version</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
            </span>
            <input
              name="version"
              aria-label="Version"
              required
              minLength={2}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="v1.0.0"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Submitter Name</span>
            <input
              name="submitterName"
              aria-label="Submitter Name"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              placeholder="Optional"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Summary</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
          </span>
          <textarea
            name="summary"
            aria-label="Summary"
            required
            minLength={10}
            className="min-h-[110px] w-full rounded-[24px] border border-line bg-white px-4 py-3 text-sm"
            placeholder="Write a compact summary that explains what this skill does."
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Markdown Description</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
          </span>
          <textarea
            name="markdownContent"
            aria-label="Markdown Description"
            required
            minLength={20}
            className="min-h-[280px] w-full rounded-[24px] border border-line bg-white px-4 py-3 font-mono text-sm"
            placeholder={"# Skill title\n\nExplain installation, usage, and examples."}
          />
        </label>
      </div>

      <div className="space-y-5 rounded-[28px] border border-line bg-[#f7f0e6] p-6">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Cover Image</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Optional</span>
          </span>
          <input
            type="file"
            name="coverImage"
            aria-label="Cover Image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-sm text-muted"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Bundle Zip</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
          </span>
          <input
            type="file"
            name="bundle"
            aria-label="Bundle Zip"
            required
            accept=".zip,.tar,.gz"
            className="block w-full text-sm text-muted"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Contact</span>
          <input
            name="submitterContact"
            aria-label="Contact"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            placeholder="Email / GitHub / WeChat"
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
          Submit for Review
        </button>
      </div>
    </form>
  );
}
