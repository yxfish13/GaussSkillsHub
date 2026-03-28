import React from "react";
import { SkillSubmissionForm } from "@/components/forms/skill-submission-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicSkillVersionPrefill } from "@/lib/skills/queries";

const submissionModes = ["new", "docs", "release"] as const;

type SubmissionMode = (typeof submissionModes)[number];

type SubmitPageProps = {
  searchParams?: {
    status?: string;
    from?: string;
    base?: string;
    mode?: string;
  };
};

function getSubmissionMode(value?: string): SubmissionMode {
  return submissionModes.find((mode) => mode === value) ?? "new";
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const mode = getSubmissionMode(searchParams?.mode);
  const prefill = searchParams?.from ? await getPublicSkillVersionPrefill(searchParams.from, searchParams?.base) : null;

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="公开发布"
        title={mode === "docs" ? "更新 Skill 说明" : mode === "release" ? "发布 Skill 新版本" : "提交 Skill"}
        description="任何人都可以公开提交 Skill。每一次修改都会生成一个新版本，旧版本保持可读。"
      />
      <SkillSubmissionForm mode={mode} prefill={prefill} status={searchParams?.status} />
    </section>
  );
}
