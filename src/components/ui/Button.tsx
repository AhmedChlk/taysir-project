"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/format";

/* ==========================================================================
   Button — the single button primitive for the dashboard.
   Variants map to design-system roles; sizes keep vertical rhythm. Replaces
   the per-page hand-rolled buttons. Tokens only (brand / accent / surface).
   ========================================================================== */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
	primary:
		"bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700",
	secondary:
		"bg-surface-white text-ink-900 border border-line hover:bg-surface-50 hover:border-brand-300",
	ghost: "bg-transparent text-ink-500 hover:bg-surface-50 hover:text-ink-900",
	danger: "bg-accent-600 text-white shadow-sm hover:bg-accent",
};

const SIZES: Record<Size, string> = {
	sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
	md: "h-10 px-4 text-sm gap-2 rounded-xl",
	lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
	/** Optional leading icon (already sized). */
	icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ variant = "primary", size = "md", icon, className, children, ...rest },
		ref,
	) => (
		<button
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center font-bold tracking-tight whitespace-nowrap transition-all",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1",
				"disabled:opacity-50 disabled:pointer-events-none",
				VARIANTS[variant],
				SIZES[size],
				className,
			)}
			{...rest}
		>
			{icon}
			{children}
		</button>
	),
);
Button.displayName = "Button";
