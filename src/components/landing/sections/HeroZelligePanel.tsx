"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { DemoButton } from "../lib/DemoCta";

/* ==========================================================================
   HeroZelligePanel — "Le Panneau Zellige" (workflow: layout-expert).
   The hero IS a single Maghrebi tile panel: a gutterless girih tessellation
   where every tile is one live module of the school, and an octagonal star
   tile seats the headline + CTA INTO the mosaic. Terracotta "grout" traces
   every seam. On load the tiles arrive scattered and settle into the grid —
   the TARTEEB chaos→order gesture (workflow: motion-expert). One viewport
   shows the WHOLE school. RTL mirrors via grid-area swap (CSS).
   ========================================================================== */

// Deterministic scatter (no Math.random → no hydration mismatch). Order matches
// the JSX tile order; delays radiate outward from the star so order "assembles".
const SCATTER = [
	{ r: -2, x: -14, y: -10, d: 0.0 }, // star (anchor, lands first)
	{ r: 3, x: 16, y: -12, d: 0.14 }, // élèves
	{ r: -3, x: 18, y: -8, d: 0.18 }, // présences
	{ r: 2, x: 16, y: 14, d: 0.24 }, // emploi du temps
	{ r: -3, x: -16, y: 12, d: 0.1 }, // paiements (money — lands early)
	{ r: 3, x: -10, y: 16, d: 0.28 }, // inscriptions
	{ r: -2, x: -18, y: 10, d: 0.36 }, // staff
	{ r: 3, x: 12, y: 16, d: 0.32 }, // salles
	{ r: -3, x: 18, y: 12, d: 0.4 }, // activités
];
const NO_SCATTER = { r: 0, x: 0, y: 0, d: 0 };

/* Numbers count up as their tile lands — the data "comes alive". */
function CountUp({
	to,
	prefix = "",
	suffix = "",
	delay = 0,
}: {
	to: number;
	prefix?: string;
	suffix?: string;
	delay?: number;
}) {
	const reduced = useReducedMotion();
	const [v, setV] = useState(reduced ? to : 0);
	useEffect(() => {
		if (reduced) {
			setV(to);
			return;
		}
		let raf = 0;
		let t0 = 0;
		const dur = 1000;
		const tick = (t: number) => {
			if (!t0) t0 = t;
			const k = Math.min(1, (t - t0) / dur);
			setV(Math.round(to * (1 - (1 - k) ** 3)));
			if (k < 1) raf = requestAnimationFrame(tick);
		};
		const id = window.setTimeout(() => {
			raf = requestAnimationFrame(tick);
		}, delay * 1000);
		return () => {
			window.clearTimeout(id);
			cancelAnimationFrame(raf);
		};
	}, [to, delay, reduced]);
	return (
		<>
			{prefix}
			{v.toLocaleString("fr-FR")}
			{suffix}
		</>
	);
}

function StarGlyph() {
	return (
		<svg
			width="34"
			height="34"
			viewBox="0 0 48 48"
			fill="none"
			aria-hidden
			style={{ opacity: 0.9 }}
		>
			<title>Zellige</title>
			<path
				d="M24 2l5.7 11.6L42 15l-8.8 8.6L35 36l-11-5.8L13 36l1.8-12.4L6 15l12.3-1.4z"
				stroke="var(--brass-bright)"
				strokeWidth="1.4"
				fill="none"
			/>
			<rect
				x="17"
				y="17"
				width="14"
				height="14"
				transform="rotate(45 24 24)"
				stroke="var(--brass-bright)"
				strokeWidth="1.1"
				fill="none"
				opacity="0.7"
			/>
		</svg>
	);
}

export function HeroZelligePanel() {
	const reduced = useReducedMotion();
	const gridRef = useRef<HTMLDivElement>(null);

	// Pointer "torch": a glaze of light + a subtle 3D tilt follow the cursor, so
	// the mosaic feels alive and invites exploration. Mouse-only; reduced-motion off.
	useEffect(() => {
		if (reduced) return;
		const el = gridRef.current;
		if (!el) return;
		let raf = 0;
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const r = el.getBoundingClientRect();
				const x = e.clientX - r.left;
				const y = e.clientY - r.top;
				const px = x / r.width - 0.5;
				const py = y / r.height - 0.5;
				el.style.setProperty("--mx", `${x}px`);
				el.style.setProperty("--my", `${y}px`);
				el.style.setProperty("--tx", `${px * 5}deg`);
				el.style.setProperty("--ty", `${-py * 4}deg`);
				el.style.setProperty("--spot", "1");
			});
		};
		const onLeave = () => {
			el.style.setProperty("--tx", "0deg");
			el.style.setProperty("--ty", "0deg");
			el.style.setProperty("--spot", "0");
		};
		el.addEventListener("pointermove", onMove);
		el.addEventListener("pointerleave", onLeave);
		return () => {
			el.removeEventListener("pointermove", onMove);
			el.removeEventListener("pointerleave", onLeave);
			cancelAnimationFrame(raf);
		};
	}, [reduced]);

	const tile = (i: number) => {
		const s = SCATTER[i] ?? NO_SCATTER;
		if (reduced) {
			return {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: { duration: 0.4, delay: i * 0.04 },
			};
		}
		return {
			initial: { opacity: 0, scale: 0.92, rotate: s.r, x: s.x, y: s.y },
			animate: { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 },
			transition: {
				duration: 0.66,
				delay: 0.12 + s.d,
				ease: [0.62, 0.05, 0, 1] as const, // --ease-zellige: drift then snap
			},
			// Module tiles lift on hover (affordance — "alive"); the star stays put.
			...(i > 0
				? {
						whileHover: {
							y: -5,
							scale: 1.018,
							transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
						},
					}
				: {}),
		};
	};

	return (
		<section className="hz-section" aria-label="Taysir — pilotez votre école">
			<div className="hz-grid" ref={gridRef}>
				<div className="hz-spotlight" aria-hidden />
				{/* STAR — headline seated into the mosaic */}
				<motion.div className="hz-tile hz-star" {...tile(0)}>
					<div className="hz-star-top">
						<StarGlyph />
						<span className="hz-modules-line">
							Élèves <i>·</i> Paiements <i>·</i> Emploi du temps <i>·</i>{" "}
							Présences
						</span>
					</div>
					<h1 className="hz-title">
						Pilotez votre école entière
						<span className="hz-coda">sans le chaos.</span>
					</h1>
					<div className="hz-cta">
						<DemoButton className="btn btn--hero-primary">
							Réserver une démo
							<span className="btn-arrow" aria-hidden>
								→
							</span>
						</DemoButton>
						<a href={"#produit" as Route} className="btn btn--hero-ghost">
							▸ Voir Taysir en action
						</a>
					</div>
				</motion.div>

				{/* ÉLÈVES */}
				<motion.div className="hz-tile hz-elv hz-bone" {...tile(1)}>
					<span className="hz-label">Élèves</span>
					<span className="hz-num t-num">
						<CountUp to={1842} delay={0.45} />
					</span>
					<span className="hz-meta">
						<span className="hz-up">+5</span> cette semaine
					</span>
					<div className="hz-dots" aria-hidden>
						{["a", "b", "c", "d"].map((k) => (
							<span key={k} className="hz-dot" />
						))}
						<span className="hz-dot hz-dot--more">+</span>
					</div>
				</motion.div>

				{/* PRÉSENCES */}
				<motion.div className="hz-tile hz-prs hz-wash" {...tile(2)}>
					<span className="hz-label">Présences</span>
					<span className="hz-num t-num">
						<CountUp to={96} suffix="%" delay={0.5} />
					</span>
					<span className="hz-checks" aria-hidden>
						✓✓✓<span className="hz-check-abs">·</span>✓✓
					</span>
					<span className="hz-meta">aujourd'hui</span>
				</motion.div>

				{/* EMPLOI DU TEMPS — the live product surface (biggest tile) */}
				<motion.div className="hz-tile hz-edt hz-bone" {...tile(3)}>
					<span className="hz-label">
						Emploi du temps
						<span className="hz-edt-day">aujourd'hui</span>
					</span>
					<ul className="hz-sched">
						<li>
							<b className="t-num">08:00</b> Maths{" "}
							<span className="hz-room">S.4</span>
							<span className="hz-ok">●</span>
						</li>
						<li>
							<b className="t-num">09:45</b> Physique{" "}
							<span className="hz-room">S.2</span>
							<span className="hz-ok">●</span>
						</li>
						<li>
							<b className="t-num">10:30</b> Anglais{" "}
							<span className="hz-room">S.6</span>
							<span className="hz-ok">●</span>
						</li>
						<li className="hz-conflict">
							<b className="t-num">14:00</b> Sciences{" "}
							<span className="hz-room">S.1</span>
							<span className="hz-warn">⚠ conflit</span>
						</li>
					</ul>
				</motion.div>

				{/* PAIEMENTS */}
				<motion.div className="hz-tile hz-pay hz-bone" {...tile(4)}>
					<span className="hz-label">Paiements</span>
					<span className="hz-num t-num hz-num--sm">
						<CountUp to={78} suffix="%" delay={0.4} />
					</span>
					<div className="hz-bar" aria-hidden>
						<motion.span
							initial={{ width: 0 }}
							animate={{ width: "78%" }}
							transition={{
								duration: 0.95,
								delay: 0.5,
								ease: [0.16, 1, 0.3, 1],
							}}
						/>
					</div>
					<span className="hz-meta">
						<span className="hz-impaye t-num">3</span> impayés ↓
					</span>
				</motion.div>

				{/* INSCRIPTIONS */}
				<motion.div className="hz-tile hz-ins hz-dark" {...tile(5)}>
					<span className="hz-label hz-label--ondark">Inscriptions</span>
					<span className="hz-num t-num hz-num--brass">
						<CountUp to={12} prefix="+" delay={0.55} />
					</span>
					<span className="hz-meta hz-meta--ondark">ce mois</span>
				</motion.div>

				{/* STAFF */}
				<motion.div className="hz-tile hz-stf hz-bone" {...tile(6)}>
					<span className="hz-label">Staff</span>
					<span className="hz-row">
						<span className="hz-num hz-num--sm t-num">
							<CountUp to={24} delay={0.6} />
						</span>
						<span className="hz-meta">intervenants · 6 matières</span>
					</span>
				</motion.div>

				{/* SALLES */}
				<motion.div className="hz-tile hz-sal hz-wash" {...tile(7)}>
					<span className="hz-label">Salles</span>
					<span className="hz-num hz-num--sm t-num">4/6</span>
					<span className="hz-meta">occupées</span>
				</motion.div>

				{/* ACTIVITÉS */}
				<motion.div className="hz-tile hz-act hz-dark" {...tile(8)}>
					<span className="hz-label hz-label--ondark">Activités</span>
					<span className="hz-num t-num hz-num--brass">03</span>
					<span className="hz-meta hz-meta--ondark">clubs</span>
				</motion.div>
			</div>

			<div className="hz-trust">
				<span>14 jours d'essai</span>
				<i>·</i>
				<span>Sans carte bancaire</span>
				<i>·</i>
				<span>Relances WhatsApp incluses</span>
				<i>·</i>
				<span>FR · العربية</span>
			</div>
		</section>
	);
}
