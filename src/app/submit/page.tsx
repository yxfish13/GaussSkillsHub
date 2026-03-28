import React from "react";
import { SkillSubmissionForm } from "@/components/forms/skill-submission-form";
import { SectionHeading } from "@/components/ui/section-heading";

type SubmitPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default function SubmitPage({ searchParams }: SubmitPageProps) {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Anonymous Submission"
        title="Submit a Skill for Review"
        description="Anyone can upload a new skill or a new version for an existing slug. An administrator reviews every submission before it becomes public."
      />
      <SkillSubmissionForm status={searchParams?.status} />
    </section>
  );
}
