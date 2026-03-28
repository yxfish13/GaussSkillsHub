"use client";

import React, { useState } from "react";
import { submitAdminReviewAction } from "@/app/actions/admin";
import { LiveMarkdownPreview } from "@/components/admin/live-markdown-preview";

type ReviewEditorProps = {
  version: {
    id: string;
    title: string;
    summary: string;
    markdownContent: string;
    version: string;
    status: string;
    reviewNotes: string | null;
    bundleName: string | null;
    submitterName: string | null;
    submitterContact: string | null;
    submittedAt: string;
    slug: string;
  };
  status?: string;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "saved":
      return "Draft changes saved.";
    case "approved":
      return "Version approved and published.";
    case "rejected":
      return "Version rejected.";
    case "resubmitted":
      return "Version resubmitted for review.";
    case "invalid-content":
      return "Title, summary, and markdown content must all meet the publication rules before approval.";
    case "review-note-required":
      return "A rejection note is required before this version can be rejected.";
    case "invalid-intent":
      return "This review action is no longer valid. Reload the page and try again.";
    case "error":
      return "Unable to update this version.";
    default:
      return null;
  }
}

export function ReviewEditor({ version, status }: ReviewEditorProps) {
  const [markdownContent, setMarkdownContent] = useState(version.markdownContent);
  const [activeIntent, setActiveIntent] = useState<"save" | "approve" | "reject" | "resubmit">("save");
  const message = getStatusMessage(status);
  const reviewNoteRequired = activeIntent === "reject";

  return (
    <form action={submitAdminReviewAction} className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <input type="hidden" name="versionId" value={version.id} />

      <div className="space-y-5 rounded-[28px] border border-line bg-white/70 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-[#fcfaf7] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Version</p>
            <p className="pt-2 text-lg font-semibold text-ink">{version.version}</p>
          </div>
          <div className="rounded-2xl border border-line bg-[#fcfaf7] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Status</p>
            <p className="pt-2 text-lg font-semibold text-ink">{version.status}</p>
          </div>
        </div>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Title</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
          </span>
          <input
            name="title"
            defaultValue={version.title}
            required
            minLength={2}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Summary</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
          </span>
          <textarea
            name="summary"
            defaultValue={version.summary}
            required
            minLength={10}
            className="min-h-[110px] w-full rounded-[24px] border border-line bg-white px-4 py-3 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Markdown Content</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Required</span>
          </span>
          <textarea
            name="markdownContent"
            value={markdownContent}
            onChange={(event) => setMarkdownContent(event.target.value)}
            required
            minLength={20}
            className="min-h-[320px] w-full rounded-[24px] border border-line bg-white px-4 py-3 font-mono text-sm"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="flex items-center justify-between gap-3">
            <span>Review Note</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {reviewNoteRequired ? "Required for Reject" : "Optional"}
            </span>
          </span>
          <textarea
            name="reviewNote"
            defaultValue={version.reviewNotes ?? ""}
            required={reviewNoteRequired}
            className="min-h-[110px] w-full rounded-[24px] border border-line bg-white px-4 py-3 text-sm"
          />
        </label>

        <div className="grid gap-4 rounded-[24px] border border-line bg-[#f7f0e6] p-4 text-sm text-muted sm:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Submitter</p>
            <p className="pt-2">{version.submitterName || "Anonymous"}</p>
            <p>{version.submitterContact || "No contact provided"}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Bundle</p>
            <p className="pt-2">{version.bundleName || "No bundle uploaded"}</p>
            <p>{new Date(version.submittedAt).toLocaleString()}</p>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted">{message}</div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="intent"
            value="save"
            formNoValidate
            onMouseDown={() => setActiveIntent("save")}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
          >
            Save Draft
          </button>
          <button
            type="submit"
            name="intent"
            value="approve"
            onMouseDown={() => setActiveIntent("approve")}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
          >
            Approve
          </button>
          <button
            type="submit"
            name="intent"
            value="reject"
            onMouseDown={() => setActiveIntent("reject")}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
          >
            Reject
          </button>
          {version.status === "rejected" ? (
            <button
              type="submit"
              name="intent"
              value="resubmit"
              onMouseDown={() => setActiveIntent("resubmit")}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
            >
              Resubmit
            </button>
          ) : null}
        </div>
      </div>

      <LiveMarkdownPreview content={markdownContent} />
    </form>
  );
}
