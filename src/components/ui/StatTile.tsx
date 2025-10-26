import React from "react";

type StatTileProps = {
  label: string;
  value: string | number;
  subtext?: string;
};

export default function StatTile({ label, value, subtext }: StatTileProps) {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 flex flex-col gap-1 shadow-lg">
      <span className="text-[11px] font-medium uppercase text-white/50">{label}</span>
      <span className="text-3xl font-extrabold text-gold font-headline tracking-tighter">{value}</span>
      {subtext && <span className="text-xs text-white/40">{subtext}</span>}
    </div>
  );
}
