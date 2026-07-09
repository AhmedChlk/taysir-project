"use client";

import { useEffect, useRef, useState } from "react";

export const CountUp = ({
	to,
	duration = 900,
}: {
	to: number;
	duration?: number;
}) => {
	const [v, setV] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);
	const started = useRef(false);

	useEffect(() => {
		if (!ref.current) return;
		const io = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting && !started.current) {
					started.current = true;
					const t0 = performance.now();
					const tick = (t: number) => {
						const k = Math.min(1, (t - t0) / duration);
						const e = 1 - (1 - k) ** 3;
						setV(Math.round(to * e));
						if (k < 1) requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				}
			},
			{ threshold: 0.5 },
		);
		io.observe(ref.current);
		return () => io.disconnect();
	}, [to, duration]);

	return <span ref={ref}>{v}</span>;
};
