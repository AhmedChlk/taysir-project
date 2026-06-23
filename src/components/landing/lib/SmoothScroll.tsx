"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { type ReactNode, useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis-powered inertia smooth scrolling — the same buttery scroll feel as
 * dropbox.com (which ships `html.lenis-smooth`). Driven off GSAP's ticker so it
 * stays perfectly in sync with every ScrollTrigger-based reveal on the page.
 *
 * Honors prefers-reduced-motion: users who opt out keep native scrolling.
 */
export function SmoothScroll({ children }: { children?: ReactNode }) {
	useEffect(() => {
		if (
			typeof window === "undefined" ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			return;
		}

		const lenis = new Lenis({
			duration: 1.1,
			// expo-out: fast start, long glide — matches Dropbox's inertia
			easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
			smoothWheel: true,
			touchMultiplier: 1.6,
		});

		// keep ScrollTrigger's idea of scroll position synced to Lenis
		lenis.on("scroll", ScrollTrigger.update);

		const onTick = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(onTick);
		gsap.ticker.lagSmoothing(0);

		return () => {
			gsap.ticker.remove(onTick);
			lenis.destroy();
		};
	}, []);

	return <>{children}</>;
}
