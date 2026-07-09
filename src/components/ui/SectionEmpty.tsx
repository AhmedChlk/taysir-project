import type { ReactNode } from "react";

/* ==========================================================================
   SectionEmpty — one consistent empty-state for in-page sections (tables,
   lists). Tokenised; optional action slot. Distinct from the page-level
   EmptyState, kept lighter for inside cards.
   ========================================================================== */

export interface SectionEmptyProps {
	icon?: ReactNode;
	title: ReactNode;
	hint?: ReactNode;
	action?: ReactNode;
}

export const SectionEmpty = ({
	icon,
	title,
	hint,
	action,
}: SectionEmptyProps) => (
	<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
		{icon && (
			<span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-ink-400">
				{icon}
			</span>
		)}
		<div className="space-y-1">
			<p className="font-bold text-ink-900">{title}</p>
			{hint && <p className="t-body text-ink-500 max-w-sm">{hint}</p>}
		</div>
		{action && <div className="mt-2">{action}</div>}
	</div>
);
