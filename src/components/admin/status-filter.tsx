import React from "react";

type StatusFilterProps = {
  counts: {
    submitted: number;
    approved: number;
    rejected: number;
  };
};

export function StatusFilter({ counts }: StatusFilterProps) {
  const items = [
    { label: "Submitted", value: counts.submitted },
    { label: "Approved", value: counts.approved },
    { label: "Rejected", value: counts.rejected }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[24px] border border-line bg-white/60 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-signal">{item.label}</p>
          <p className="pt-2 text-3xl font-semibold text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
