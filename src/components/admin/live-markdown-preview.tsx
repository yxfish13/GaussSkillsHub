import React from "react";
import { MarkdownArticle } from "@/lib/markdown";

type LiveMarkdownPreviewProps = {
  content: string;
};

export function LiveMarkdownPreview({ content }: LiveMarkdownPreviewProps) {
  return (
    <div className="rounded-[28px] border border-line bg-[#fffaf3] p-6">
      <p className="pb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-signal">Live Preview</p>
      <MarkdownArticle content={content} />
    </div>
  );
}
