"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const wrap = {
	maxWidth: "var(--container)",
	margin: "0 auto",
	padding: "0 48px",
} as const;

const BARS = [38, 64, 52, 86, 72, 104, 92];

/**
 * Vectorized dashboard that "comes alive" as the user scrolls: bars grow,
 * the trend line draws itself, the KPI counts up and a side panel slides in.
 * Everything is GPU-friendly (transform / stroke-dashoffset) and scrubbed.
 */
export function LiveDashboardDraw() {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const root = ref.current;
			if (!root) return;

			const reduce =
				typeof window !== "undefined" &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches;

			const line = root.querySelector<SVGPathElement>("[data-line]");
			const area = root.querySelector<SVGPathElement>("[data-area]");
			const bars = Array.from(
				root.querySelectorAll<SVGRectElement>("[data-bar]"),
			);
			const panel = root.querySelector<HTMLElement>("[data-panel]");
			const kpi = root.querySelector<HTMLElement>("[data-kpi]");

			if (line) {
				const len = line.getTotalLength();
				line.style.strokeDasharray = `${len}`;
				line.style.strokeDashoffset = reduce ? "0" : `${len}`;
			}

			if (reduce) {
				bars.forEach((b) => {
					b.setAttribute("transform", "scale(1,1)");
				});
				if (area) area.style.opacity = "1";
				if (panel) {
					panel.style.opacity = "1";
					panel.style.transform = "none";
				}
				if (kpi) kpi.textContent = "2 480 000 DA";
				return;
			}

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: root,
					start: "top 70%",
					end: "bottom 75%",
					scrub: 0.7,
				},
			});

			tl.from(bars, {
				scaleY: 0,
				transformOrigin: "bottom",
				stagger: 0.06,
				duration: 0.5,
				ease: "power2.out",
			})
				.to(line, { strokeDashoffset: 0, duration: 1, ease: "none" }, 0.2)
				.to(area, { opacity: 1, duration: 0.6 }, 0.5)
				.from(panel, { opacity: 0, x: 40, duration: 0.6 }, 0.6);

			if (kpi) {
				const proxy = { v: 0 };
				tl.to(
					proxy,
					{
						v: 2480000,
						duration: 1,
						ease: "power1.out",
						onUpdate: () => {
							kpi.textContent = `${Math.round(proxy.v).toLocaleString("fr-FR")} DA`;
						},
					},
					0.3,
				);
			}
		},
		{ scope: ref },
	);

	return (
		<section style={{ background: "#fff", padding: "120px 0" }}>
			<div ref={ref} style={wrap}>
				<div
					style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}
				>
					<div
						style={{
							fontSize: 13,
							fontWeight: 700,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							color: "var(--brand-500)",
						}}
					>
						En direct
					</div>
					<h2
						style={{
							fontSize: 40,
							fontWeight: 700,
							letterSpacing: "-0.025em",
							color: "var(--fg1)",
							margin: "10px 0 0",
						}}
					>
						Voyez Taysir travailler.
					</h2>
				</div>

				<div
					style={{
						position: "relative",
						maxWidth: 960,
						margin: "0 auto",
						background: "#0B3A42",
						borderRadius: 22,
						padding: 28,
						boxShadow: "0 40px 90px rgba(8,30,34,0.28)",
					}}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 260px",
							gap: 22,
							alignItems: "stretch",
						}}
						className="taysir-live-grid"
					>
						{/* Chart card */}
						<div style={{ background: "#fff", borderRadius: 16, padding: 22 }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "baseline",
									marginBottom: 8,
								}}
							>
								<span style={{ fontSize: 13, color: "var(--fg3)" }}>
									Revenus encaissés
								</span>
								<span
									data-kpi
									style={{
										fontSize: 22,
										fontWeight: 700,
										color: "var(--fg1)",
										fontVariantNumeric: "tabular-nums",
									}}
								>
									0 DA
								</span>
							</div>
							<svg
								viewBox="0 0 560 240"
								width="100%"
								height="240"
								role="img"
								aria-label="Graphique des revenus encaissés"
							>
								<defs>
									<linearGradient id="taysirArea" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#0F515C" stopOpacity="0.25" />
										<stop offset="100%" stopColor="#0F515C" stopOpacity="0" />
									</linearGradient>
								</defs>
								{/* bars */}
								{BARS.map((h, i) => (
									<rect
										key={`bar-${BARS.length - i}-${h}`}
										data-bar
										x={20 + i * 78}
										y={200 - h}
										width={34}
										height={h}
										rx={6}
										fill="#CFE3E7"
									/>
								))}
								{/* trend area + line over the bars */}
								<path
									data-area
									d="M20 150 L98 120 L176 132 L254 92 L332 104 L410 60 L498 76 L498 200 L20 200 Z"
									fill="url(#taysirArea)"
									opacity="0"
								/>
								<path
									data-line
									d="M20 150 L98 120 L176 132 L254 92 L332 104 L410 60 L498 76"
									fill="none"
									stroke="#0F515C"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>

						{/* Side panel that slides in */}
						<div
							data-panel
							style={{
								background: "rgba(255,255,255,0.06)",
								border: "1px solid rgba(255,255,255,0.12)",
								borderRadius: 16,
								padding: 20,
								color: "#fff",
								display: "flex",
								flexDirection: "column",
								gap: 14,
							}}
						>
							<div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
								Relances automatiques
							</div>
							{[
								{ n: "Yacine B.", s: "Tranche 2 — relance envoyée" },
								{ n: "Lina M.", s: "Paiement reçu ✓" },
								{ n: "Omar K.", s: "Rappel WhatsApp programmé" },
							].map((r) => (
								<div
									key={r.n}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 2,
										borderBottom: "1px solid rgba(255,255,255,0.08)",
										paddingBottom: 10,
									}}
								>
									<span style={{ fontSize: 14, fontWeight: 600 }}>{r.n}</span>
									<span
										style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
									>
										{r.s}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
