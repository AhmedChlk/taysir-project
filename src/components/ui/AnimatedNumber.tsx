"use client";

import { useEffect, useRef, useState } from "react";

/* ==========================================================================
   AnimatedNumber — compteur animé 0 → valeur AU MONTAGE.
   Micro-interaction « satisfaisante » sur les KPIs (peak-end : la montée des
   chiffres rend le tableau de bord vivant). L'animation part au montage (pas
   d'IntersectionObserver) : les KPI sous la ligne de flottaison ne restent donc
   plus bloqués sur « 0 » tant qu'on n'a pas scrollé — au moment où l'on arrive,
   la valeur réelle est déjà affichée. Respecte prefers-reduced-motion.
   ========================================================================== */

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export interface AnimatedNumberProps {
	value: number;
	/** Suffixe collé après la valeur (ex. « DA », « % »). Sérialisable (string)
	    → l'appelant peut être un Server Component (pas de prop fonction). */
	suffix?: string;
	durationMs?: number;
	className?: string;
}

export function AnimatedNumber({
	value,
	suffix = "",
	durationMs = 550,
	className,
}: AnimatedNumberProps) {
	const format = (n: number) =>
		`${Math.round(n).toLocaleString("fr-FR")}${suffix}`;
	const [display, setDisplay] = useState(0);
	const ref = useRef<HTMLSpanElement | null>(null);

	useEffect(() => {
		const reduced =
			typeof window !== "undefined" &&
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		if (reduced) {
			setDisplay(value);
			return;
		}

		let raf = 0;
		const start = performance.now();
		const tick = (nowT: number) => {
			const p = Math.min(1, (nowT - start) / durationMs);
			setDisplay(value * easeOutCubic(p));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	}, [value, durationMs]);

	return (
		<span ref={ref} className={className}>
			{format(display)}
		</span>
	);
}
