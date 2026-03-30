import React from "react";
import { notFound } from "next/navigation";
import { AdminSkillControls } from "@/components/admin/admin-skill-controls";
import { ReviewEditor } from "@/components/admin/review-editor";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdminSession } from "@/lib/auth-server";
import { getSkillVersionForReview } from "@/lib/skills/queries";

export const dynamic = "force-dynamic";

type AdminReviewPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    status?: string;
  };
};

export default async function AdminReviewPage({ params, searchParams }: AdminReviewPageProps) {
  await requireAdminSession();
  const detail = await getSkillVersionForReview(params.id);

  if (!detail) {
    notFound();
  }

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Version Review"
        title={detail.version.title}
        description={`Reviewing ${detail.version.slug} ${detail.version.version}`}
      />
      <AdminSkillControls
        skillId={detail.version.skillId}
        slug={detail.version.slug}
        versionId={detail.version.id}
        visibility={detail.version.visibility}
      />
      <ReviewEditor version={detail.version} status={searchParams?.status} />
    </section>
  );
}
