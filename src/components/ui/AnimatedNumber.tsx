"use client";

import { useEffect, useRef, useState } from "react";

/* ==========================================================================
   AnimatedNumber — compteur animé 0 → valeur au montage / entrée en vue.
   Micro-interaction « satisfaisante » sur les KPIs (loi de Doherty : le
   mouvement occupe l'œil pendant que la page se pose ; peak-end : la montée
   des chiffres rend le tableau de bord vivant). Respecte prefers-reduced-motion
   et l'IntersectionObserver (n'anime qu'une fois visible).
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
	durationMs = 900,
	className,
}: AnimatedNumberProps) {
	const format = (n: number) => `${Math.round(n).toLocaleString("fr-FR")}${suffix}`;
	const [display, setDisplay] = useState(0);
	const ref = useRef<HTMLSpanElement | null>(null);
	const startedRef = useRef(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const reduced =
			typeof window !== "undefined" &&
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		if (reduced) {
			setDisplay(value);
			return;
		}

		let raf = 0;
		const run = () => {
			if (startedRef.current) return;
			startedRef.current = true;
			const start = performance.now();
			const tick = (nowT: number) => {
				const p = Math.min(1, (nowT - start) / durationMs);
				setDisplay(value * easeOutCubic(p));
				if (p < 1) raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		};

		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						run();
						io.disconnect();
					}
				}
			},
			{ threshold: 0.2 },
		);
		io.observe(node);

		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
		};
	}, [value, durationMs]);

	return (
		<span ref={ref} className={className}>
			{format(display)}
		</span>
	);
}
