import type { ReactNode } from "react";
import { cn } from "@/utils/format";
import { Card } from "./Card";

/* ==========================================================================
   StatCard — one KPI tile, tokenised. Replaces the per-page KPI cards whose
   icons used raw blue/green/red. `tone` drives the icon chip + value accent.
   ========================================================================== */

type Tone = "brand" | "positive" | "warning" | "danger";

const CHIP: Record<Tone, string> = {
	brand: "bg-brand-50 text-brand-600",
	positive: "bg-emerald-50 text-emerald-600",
	warning: "bg-brass/15 text-brass",
	danger: "bg-accent-50 text-accent-600",
};

const VALUE: Record<Tone, string> = {
	brand: "text-ink-900",
	positive: "text-emerald-700",
	warning: "text-ink-900",
	danger: "text-accent-600",
};

export interface StatCardProps {
	label: ReactNode;
	value: ReactNode;
	icon?: ReactNode;
	tone?: Tone;
	/** Optional sub-line (trend, count). */
	hint?: ReactNode;
}

export const StatCard = ({
	label,
	value,
	icon,
	tone = "brand",
	hint,
}: StatCardProps) => (
	<Card className="group flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-ts-2">
		{icon && (
			<span
				className={cn(
					"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3",
					CHIP[tone],
				)}
			>
				{icon}
			</span>
		)}
		<div className="min-w-0">
			<div className="text-[11px] font-bold uppercase tracking-widest text-ink-400">
				{label}
			</div>
			<div className={cn("text-xl font-extrabold tracking-tight", VALUE[tone])}>
				{value}
			</div>
			{hint && <div className="text-xs text-ink-500 mt-0.5">{hint}</div>}
		</div>
	</Card>
);
