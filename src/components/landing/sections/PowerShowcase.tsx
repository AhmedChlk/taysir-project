"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type CSSProperties, useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const wrap = {
	maxWidth: "var(--container)",
	margin: "0 auto",
	padding: "0 48px",
} as const;

const prefersReduced = () =>
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =================================================================== */
/* MASSIVE STATS — huge numbers, variable-font weight tween + count    */
/* =================================================================== */

const STATS = [
	{ to: 248, suffix: "", label: "élèves gérés sans une seule feuille Excel" },
	{
		to: 92,
		suffix: "%",
		label: "de temps administratif économisé chaque semaine",
	},
	{ to: 0, suffix: "", label: "donnée partagée entre deux établissements" },
];

export function MassiveStats() {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const root = ref.current;
			if (!root) return;
			const nums = Array.from(root.querySelectorAll<HTMLElement>("[data-num]"));

			if (prefersReduced()) {
				nums.forEach((el) => {
					el.textContent = (el.dataset.num ?? "0") + (el.dataset.suffix ?? "");
					el.style.fontVariationSettings = "'wght' 600";
				});
				return;
			}

			nums.forEach((el) => {
				const target = Number(el.dataset.num ?? "0");
				const suffix = el.dataset.suffix ?? "";
				const proxy = { val: 0, wght: 120 };
				gsap.to(proxy, {
					val: target,
					wght: 640,
					duration: 1.6,
					ease: "power3.out",
					scrollTrigger: { trigger: el, start: "top 85%", once: true },
					onUpdate: () => {
						el.textContent = Math.round(proxy.val).toString() + suffix;
						el.style.fontVariationSettings = `'wght' ${Math.round(proxy.wght)}`;
					},
				});
			});
		},
		{ scope: ref },
	);

	return (
		<section
			style={{ background: "#0B3A42", padding: "120px 0", color: "#fff" }}
		>
			<div ref={ref} style={wrap}>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: 48,
						alignItems: "start",
					}}
					className="taysir-stats-grid"
				>
					{STATS.map((s) => (
						<div key={s.label}>
							<div
								data-num={s.to}
								data-suffix={s.suffix}
								style={{
									fontFamily: "var(--font-display), Georgia, serif",
									fontSize: "clamp(72px, 11vw, 150px)",
									lineHeight: 0.9,
									letterSpacing: "-0.03em",
									fontVariationSettings: "'wght' 120",
									color: "#fff",
								}}
							>
								0{s.suffix}
							</div>
							<p
								style={{
									marginTop: 18,
									fontSize: 16,
									lineHeight: 1.5,
									color: "rgba(255,255,255,0.7)",
									maxWidth: 280,
								}}
							>
								{s.label}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* =================================================================== */
/* MULTI-TENANT BENTO — pinned, Z-axis zoom into the isolation tile    */
/* =================================================================== */

export function MultiTenantBento() {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const root = ref.current;
			if (!root || prefersReduced()) return;

			const stage = root.querySelector<HTMLElement>("[data-stage]");
			const focus = root.querySelector<HTMLElement>("[data-focus]");
			const others = Array.from(
				root.querySelectorAll<HTMLElement>("[data-tile]"),
			);
			const detail = root.querySelector<HTMLElement>("[data-detail]");
			if (!stage || !focus) return;

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: root,
					start: "top top",
					end: "+=140%",
					scrub: 0.6,
					pin: stage,
				},
			});

			tl.to(others, { opacity: 0.12, filter: "blur(3px)", duration: 0.4 }, 0)
				.to(
					focus,
					{ scale: 1.18, z: 220, duration: 1, ease: "power2.inOut" },
					0,
				)
				.to(detail, { opacity: 1, y: 0, duration: 0.5 }, 0.4);
		},
		{ scope: ref },
	);

	const tile: CSSProperties = {
		background: "#fff",
		border: "1px solid #EAECEF",
		borderRadius: 16,
		padding: 20,
		boxShadow: "0 8px 24px rgba(8,30,34,0.05)",
	};

	return (
		<section
			ref={ref}
			style={{ background: "#F4F7F8", position: "relative" }}
			aria-label="Architecture multi-tenant"
		>
			<div
				data-stage
				style={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					perspective: 1200,
					overflow: "hidden",
				}}
			>
				<div style={{ ...wrap, width: "100%" }}>
					<div style={{ textAlign: "center", marginBottom: 36 }}>
						<div
							style={{
								fontSize: 13,
								fontWeight: 700,
								letterSpacing: "0.1em",
								textTransform: "uppercase",
								color: "var(--brand-500)",
							}}
						>
							Architecture
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
							Chaque école dans sa bulle.
						</h2>
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gridAutoRows: "120px",
							gap: 16,
							transformStyle: "preserve-3d",
							maxWidth: 920,
							margin: "0 auto",
						}}
						className="taysir-bento"
					>
						<div data-tile style={tile}>
							<TileMini name="École El Nour" tone="#DBEAFE" />
						</div>
						<div
							data-focus
							style={{
								...tile,
								gridRow: "span 2",
								border: "2px solid var(--brand-500)",
								boxShadow: "0 30px 70px rgba(15,81,92,0.22)",
								position: "relative",
								zIndex: 5,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
							}}
						>
							<div
								style={{
									fontSize: 13,
									fontWeight: 700,
									color: "var(--brand-500)",
									letterSpacing: "0.08em",
									textTransform: "uppercase",
								}}
							>
								Isolation tenant
							</div>
							<div
								data-detail
								style={{
									opacity: 0,
									transform: "translateY(10px)",
									marginTop: 10,
									fontSize: 14,
									color: "var(--fg2)",
									maxWidth: 230,
								}}
							>
								Données chiffrées et cloisonnées par établissement. Zéro fuite
								possible entre écoles.
							</div>
						</div>
						<div data-tile style={tile}>
							<TileMini name="Institut Salam" tone="#FCE7F3" />
						</div>
						<div data-tile style={tile}>
							<TileMini name="Académie Iqra" tone="#D1FAE5" />
						</div>
						<div data-tile style={tile}>
							<TileMini name="École Andalous" tone="#FEF3C7" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function TileMini({ name, tone }: { name: string; tone: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
			<span
				style={{
					width: 30,
					height: 30,
					borderRadius: 8,
					background: tone,
					flexShrink: 0,
				}}
				aria-hidden
			/>
			<div>
				<div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>
					{name}
				</div>
				<div style={{ fontSize: 11, color: "var(--fg3)" }}>tenant isolé</div>
			</div>
		</div>
	);
}
