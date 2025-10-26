import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionCardProps = {
  title: string;
  desc: string;
  href: string;
  icon?: LucideIcon;
};

export default function SectionCard({ title, desc, href, icon: Icon }: SectionCardProps) {
  return (
    <Link href={href} className="block group">
      <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 flex items-center justify-between transition-colors hover:bg-white/5">
        <div className="flex items-center gap-4">
          {Icon && <Icon className="w-6 h-6 text-orange" />}
          <div>
            <h3 className="font-bold text-white font-headline">{title}</h3>
            <p className="text-sm text-white/50">{desc}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/30 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
