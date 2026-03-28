import React from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { SkillCard } from "@/components/skills/skill-card";
import { listLatestApprovedSkills } from "@/lib/skills/queries";

export const dynamic = "force-dynamic";

type SkillsPageProps = {
  searchParams?: {
    q?: string;
  };
};

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const skills = await listLatestApprovedSkills(searchParams?.q);

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Public Catalogue"
        title="Browse Approved Skills"
        description="Every public listing points to the latest approved version, with historical releases preserved on the detail page."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {skills.length ? (
          skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)
        ) : (
          <div className="rounded-[28px] border border-dashed border-line bg-white/60 p-10 text-sm text-muted">
            No approved skills are available yet.
          </div>
        )}
      </div>
    </section>
  );
}
