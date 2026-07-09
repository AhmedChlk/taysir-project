import type { HTMLAttributes } from "react";
import { cn } from "@/utils/format";

/* ==========================================================================
   Card — the surface primitive. One radius / border / shadow vocabulary so
   pages stop hand-rolling rounded-2xl/3xl/[32px] with ad-hoc shadows.
   `pad` toggles the default inner padding; `tone` swaps the surface.
   ========================================================================== */

type Tone = "default" | "raised" | "ghost";

const TONES: Record<Tone, string> = {
	default: "bg-surface-white border border-line/70 shadow-ts-1",
	raised: "bg-surface-white border border-line/70 shadow-ts-2",
	ghost: "bg-surface-50 border border-line/50",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	tone?: Tone;
	pad?: boolean;
}

export const Card = ({
	tone = "default",
	pad = true,
	className,
	children,
	...rest
}: CardProps) => (
	<div
		className={cn("rounded-2xl", TONES[tone], pad && "p-5", className)}
		{...rest}
	>
		{children}
	</div>
);
