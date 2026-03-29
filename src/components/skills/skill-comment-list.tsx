import React from "react";

type SkillCommentListProps = {
  comments: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
};

export function SkillCommentList({ comments }: SkillCommentListProps) {
  if (!comments.length) {
    return <div className="text-sm text-muted">还没有评论，欢迎发表第一条反馈。</div>;
  }

  return (
    <ul aria-label="评论列表" className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="space-y-2 rounded-2xl border border-line bg-white/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span className="font-medium text-ink">{comment.authorName}</span>
            <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
          </div>
          <p className="text-sm leading-6 text-ink">{comment.content}</p>
        </li>
      ))}
    </ul>
  );
}
