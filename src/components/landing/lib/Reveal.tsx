"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type RevealProps = {
	children: ReactNode;
	/** Stagger direct children instead of animating the wrapper as one block. */
	stagger?: boolean;
	/** Vertical travel distance in px. */
	y?: number;
	/** Delay before the reveal starts (seconds). */
	delay?: number;
	className?: string;
	/** Render as another element (default div). */
	as?: "div" | "section" | "ul" | "li";
};

/**
 * Scroll-triggered reveal built on GSAP ScrollTrigger.
 * Honors prefers-reduced-motion (content shows instantly, no motion).
 */
export function Reveal({
	children,
	stagger = false,
	y = 24,
	delay = 0,
	className,
	as = "div",
}: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const root = ref.current;
			if (!root) return;

			const reduce =
				typeof window !== "undefined" &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (reduce) return; // leave content in its natural, visible state

			const targets = stagger
				? (Array.from(root.children) as HTMLElement[])
				: [root];

			gsap.set(targets, { opacity: 0, y });
			gsap.to(targets, {
				opacity: 1,
				y: 0,
				duration: 0.7,
				ease: "power3.out",
				delay,
				stagger: stagger ? 0.09 : 0,
				scrollTrigger: {
					trigger: root,
					start: "top 82%",
					once: true,
				},
			});
		},
		{ scope: ref },
	);

	const Tag = as;
	return (
		<Tag ref={ref as never} className={className}>
			{children}
		</Tag>
	);
}
