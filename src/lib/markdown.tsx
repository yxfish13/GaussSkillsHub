import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

type MarkdownArticleProps = {
  content: string;
};

export function MarkdownArticle({ content }: MarkdownArticleProps) {
  return (
    <div className="space-y-4 text-[15px] leading-7 text-[#2a221c]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <h1 className="text-4xl font-semibold tracking-tight text-ink">{children}</h1>,
          h2: ({ children }) => <h2 className="pt-4 text-3xl font-semibold tracking-tight text-ink">{children}</h2>,
          h3: ({ children }) => <h3 className="pt-3 text-2xl font-semibold text-ink">{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-signal underline decoration-signal/40 underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-sm text-ink">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-2xl border border-line bg-[#201b17] p-4 font-mono text-sm text-[#f9f0e4]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-signal pl-4 italic text-muted">{children}</blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
