import React from "react";
import { requireAdminSession } from "@/lib/auth-server";
import { listAdminSkillVersions } from "@/lib/skills/queries";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusFilter } from "@/components/admin/status-filter";
import { ReviewQueue } from "@/components/admin/review-queue";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const queues = await listAdminSkillVersions();

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Admin Console"
        title="Review Queue"
        description="Inspect every submitted version, edit its markdown, and decide whether it should become public."
      />

      <StatusFilter
        counts={{
          submitted: queues.submitted.length,
          approved: queues.approved.length,
          rejected: queues.rejected.length
        }}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <ReviewQueue title="Submitted" versions={queues.submitted} />
        <ReviewQueue title="Approved" versions={queues.approved} />
        <ReviewQueue title="Rejected" versions={queues.rejected} />
      </div>
    </section>
  );
}
