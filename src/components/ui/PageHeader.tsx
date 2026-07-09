import type { ReactNode } from "react";

/* ==========================================================================
   PageHeader — the editorial header, generalised.
   Promotes the best existing pattern (Élèves / Planning: eyebrow + big bi-tone
   h1 + subtitle) into one primitive so every dashboard page shares the same
   masthead instead of three divergent paradigms. `actions` slots top-right.
   ========================================================================== */

export interface PageHeaderProps {
	/** Small uppercase kicker above the title. */
	eyebrow?: ReactNode;
	/** Leading part of the title (ink). */
	title: ReactNode;
	/** Optional emphasised tail of the title (brand colour). */
	accent?: ReactNode;
	/** One-line description under the title. */
	subtitle?: ReactNode;
	/** Right-aligned actions (buttons, toggles). */
	actions?: ReactNode;
}

export const PageHeader = ({
	eyebrow,
	title,
	accent,
	subtitle,
	actions,
}: PageHeaderProps) => (
	<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
		<div className="space-y-2">
			{eyebrow && <div className="t-eyebrow">{eyebrow}</div>}
			<h1 className="t-h1 text-ink-900">
				{title}
				{accent && (
					<>
						{" "}
						<span className="text-brand-500">{accent}</span>
					</>
				)}
			</h1>
			{subtitle && <p className="t-body text-ink-500 max-w-lg">{subtitle}</p>}
		</div>
		{actions && <div className="flex items-center gap-3">{actions}</div>}
	</div>
);
