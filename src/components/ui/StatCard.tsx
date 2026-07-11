import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/utils/format";
import { Card } from "./Card";

/* ==========================================================================
   StatCard — one KPI tile, tokenised. `tone` drives the icon chip + value
   accent. When `href` is set the tile becomes a real link: it gains a hover /
   focus-visible lift, a keyboard focus ring and a persistent "drill-down"
   chevron affordance. Non-interactive tiles stay flat (no false hover lift).
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
	/** When set, the whole tile links here (drill-down). */
	href?: string;
}

export const StatCard = ({
	label,
	value,
	icon,
	tone = "brand",
	hint,
	href,
}: StatCardProps) => {
	const interactive = Boolean(href);

	const body = (
		<Card
			className={cn(
				"relative flex h-full items-center gap-4",
				interactive &&
					"transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-ts-2 group-focus-visible:-translate-y-1 group-focus-visible:shadow-ts-2",
			)}
		>
			{icon && (
				<span
					className={cn(
						"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200",
						interactive &&
							"group-hover:scale-110 group-hover:-rotate-3 group-focus-visible:scale-110",
						CHIP[tone],
					)}
				>
					{icon}
				</span>
			)}
			<div className="min-w-0 flex-1">
				<div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
					{label}
				</div>
				<div
					className={cn("text-xl font-extrabold tracking-tight", VALUE[tone])}
				>
					{value}
				</div>
				{hint && <div className="text-xs text-ink-500 mt-0.5">{hint}</div>}
			</div>
			{interactive && (
				<ArrowUpRight
					size={16}
					aria-hidden
					className="absolute end-4 top-4 text-ink-400 opacity-40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500 group-hover:opacity-100 group-focus-visible:text-brand-500 group-focus-visible:opacity-100 rtl:rotate-[-90deg]"
				/>
			)}
		</Card>
	);

	if (!href) return body;

	return (
		<Link
			href={href}
			className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
		>
			{body}
		</Link>
	);
};
