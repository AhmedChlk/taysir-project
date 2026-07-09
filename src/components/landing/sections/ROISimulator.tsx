"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "../components/LandingIcons";

const PAINS = [
	{
		id: "paper",
		name: "Registres papier & impressions",
		price: 4500,
		unit: "/mois",
		dflt: true,
	},
	{
		id: "excel",
		name: "Fichiers Excel dispersés",
		price: 2200,
		unit: "/mois",
		dflt: true,
	},
	{
		id: "sms",
		name: "SMS manuels aux parents",
		price: 3800,
		unit: "/mois",
		dflt: true,
	},
	{
		id: "planning",
		name: "Outil de planning externe",
		price: 6500,
		unit: "/mois",
		dflt: false,
	},
	{
		id: "pay",
		name: "Suivi des paiements manuel",
		price: 1500,
		unit: "/élève/an",
		dflt: true,
		perStudent: true,
	},
	{
		id: "absent",
		name: "Relances d'absence (appels)",
		price: 2800,
		unit: "/mois",
		dflt: false,
	},
	{
		id: "docs",
		name: "Classement documents physiques",
		price: 1800,
		unit: "/mois",
		dflt: false,
	},
	{
		id: "reports",
		name: "Rapports trimestriels manuels",
		price: 3500,
		unit: "/mois",
		dflt: false,
	},
];

export const ROISimulator = () => {
	const [selected, setSelected] = useState(
		() => new Set(PAINS.filter((p) => p.dflt).map((p) => p.id)),
	);
	const [students, setStudents] = useState(180);

	const toggle = (id: string) => {
		setSelected((s) => {
			const n = new Set(s);
			n.has(id) ? n.delete(id) : n.add(id);
			return n;
		});
	};

	const monthly = useMemo(() => {
		let total = 0;
		for (const p of PAINS) {
			if (selected.has(p.id))
				total += p.perStudent ? (p.price * students) / 12 : p.price;
		}
		return Math.round(total);
	}, [selected, students]);

	const annual = monthly * 12;

	// Tween displayed numbers
	const useTween = (target: number) => {
		const [v, setV] = useState(target);
		const ref = useRef<number | null>(null);
		useEffect(() => {
			if (ref.current !== null) cancelAnimationFrame(ref.current);
			const start = v,
				delta = target - start,
				t0 = performance.now(),
				dur = 420;
			const step = (t: number) => {
				const k = Math.min(1, (t - t0) / dur);
				const e = 1 - (1 - k) ** 3;
				setV(Math.round(start + delta * e));
				if (k < 1) ref.current = requestAnimationFrame(step);
			};
			ref.current = requestAnimationFrame(step);
			return () => {
				if (ref.current !== null) cancelAnimationFrame(ref.current);
			};
		}, [target, v]);
		return v;
	};
	const dMonthly = useTween(monthly);
	const dAnnual = useTween(annual);

	return (
		<section id="simulateur" style={{ background: "#fff", padding: "120px 0" }}>
			<div
				style={{
					maxWidth: "var(--container)",
					margin: "0 auto",
					padding: "0 48px",
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 64,
					alignItems: "center",
					marginBottom: 48,
				}}
			>
				<div>
					<div className="t-eyebrow">Simulateur de rentabilité</div>
					<h2 style={{ margin: "12px 0 16px", textWrap: "balance" }}>
						Plus d'administration. Moins d'outils.
					</h2>
					<p
						style={{
							fontSize: 17,
							color: "var(--fg2)",
							margin: 0,
							maxWidth: 480,
							lineHeight: 1.55,
						}}
					>
						Cochez tout ce que votre école gère aujourd'hui à la main ou avec
						des outils dispersés. Taysir le remplace — et vous montre combien
						vous économisez, dès le premier mois.
					</p>
				</div>

				{/* Stack of "crossed-out tools" illustration, Notion-style */}
				<div
					style={{
						position: "relative",
						display: "flex",
						gap: 12,
						justifyContent: "center",
						alignItems: "center",
						flexWrap: "wrap",
						padding: "20px 0",
					}}
				>
					{[
						"Excel",
						"WhatsApp",
						"Cahier",
						"Word",
						"Post-it",
						"PDF",
						"SMS",
						"Agenda",
						"Fax",
					].map((t) => (
						<div
							key={t}
							style={{
								background: "#F3F4F6",
								borderRadius: 12,
								padding: "10px 14px",
								fontSize: 13,
								fontWeight: 600,
								color: "var(--fg3)",
								position: "relative",
								overflow: "hidden",
							}}
						>
							{t}
						</div>
					))}
					{/* The crossing-out line */}
					<svg
						style={{
							position: "absolute",
							top: "50%",
							left: 0,
							width: "100%",
							height: 60,
							transform: "translateY(-50%)",
							pointerEvents: "none",
						}}
						viewBox="0 0 400 60"
						preserveAspectRatio="none"
					>
						<motion.path
							d="M 10 42 Q 200 10, 390 36"
							stroke="#0B1220"
							strokeWidth="2.5"
							fill="none"
							strokeLinecap="round"
							initial={{ pathLength: 0 }}
							whileInView={{ pathLength: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: 1.2,
								ease: [0.22, 1, 0.36, 1],
								delay: 0.2,
							}}
						/>
					</svg>
				</div>
			</div>

			<div
				style={{
					maxWidth: "calc(var(--container) - 96px)",
					margin: "0 auto",
					background: "#fff",
					borderRadius: 18,
					boxShadow: "var(--shadow-2)",
					border: "1px solid #EDEFF2",
					padding: "36px 40px",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						columnGap: 24,
					}}
				>
					{PAINS.map((p) => {
						const on = selected.has(p.id);
						return (
							<label
								key={p.id}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 12,
									padding: "10px 4px",
									cursor: "pointer",
									userSelect: "none",
								}}
							>
								<span
									style={{
										width: 20,
										height: 20,
										borderRadius: 6,
										flexShrink: 0,
										border: on
											? "1.5px solid var(--brand-500)"
											: "1.5px solid #CBD5E1",
										background: on ? "var(--brand-500)" : "#fff",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										transition: "all 180ms var(--ease)",
									}}
								>
									{on && <Check size={12} color="#fff" strokeWidth={3} />}
								</span>
								<input
									type="checkbox"
									checked={on}
									onChange={() => toggle(p.id)}
									style={{ display: "none" }}
								/>
								<span
									style={{
										fontSize: 14,
										fontWeight: 500,
										color: "var(--fg1)",
										flex: 1,
									}}
								>
									{p.name}
								</span>
								<span
									style={{
										fontSize: 12,
										color: "var(--fg3)",
										fontVariantNumeric: "tabular-nums",
									}}
								>
									{p.perStudent
										? `${p.price} DA ${p.unit}`
										: `${p.price.toLocaleString("fr-FR")} DA ${p.unit}`}
								</span>
							</label>
						);
					})}
				</div>

				<div style={{ height: 1, background: "#EEF1F3", margin: "20px 0" }} />

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1.2fr 1fr",
						gap: 48,
						alignItems: "center",
					}}
				>
					<div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<span
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: "var(--fg3)",
									textTransform: "uppercase",
									letterSpacing: "0.06em",
								}}
							>
								Nombre d'élèves
							</span>
							<span
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "var(--brand-900)",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{students}
							</span>
						</div>

						<input
							type="range"
							min={50}
							max={1500}
							step={10}
							value={students}
							onChange={(e) => setStudents(Number(e.target.value))}
							className="roi-slider"
							style={{
								width: "100%",
								height: 6,
								borderRadius: 999,
								WebkitAppearance: "none",
								outline: "none",
								background: `linear-gradient(to right, var(--brand-500) 0%, var(--brand-300) ${((students - 50) / 1450) * 100}%, #EEF1F3 ${((students - 50) / 1450) * 100}%, #EEF1F3 100%)`,
							}}
						/>

						<style>{`
              .roi-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: white;
                border: 2px solid var(--brand-500);
                cursor: pointer;
                box-shadow: var(--shadow-1);
                transition: transform 120ms ease;
              }
              .roi-slider::-webkit-slider-thumb:hover {
                transform: scale(1.1);
              }
              .roi-slider::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: white;
                border: 2px solid var(--brand-500);
                cursor: pointer;
                box-shadow: var(--shadow-1);
                transition: transform 120ms ease;
              }
              .roi-slider::-moz-range-thumb:hover {
                transform: scale(1.1);
              }
            `}</style>
					</div>

					<div
						style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
					>
						<div
							style={{
								padding: "20px 24px",
								background: "var(--surface-0)",
								borderRadius: 16,
								border: "1px solid #E5E7EB",
								boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
							}}
						>
							<div
								style={{
									fontSize: 11,
									fontWeight: 600,
									color: "var(--fg3)",
									textTransform: "uppercase",
									letterSpacing: "0.06em",
									marginBottom: 8,
								}}
							>
								Mensuel
							</div>
							<div
								className="t-num"
								style={{
									fontSize: 28,
									fontWeight: 700,
									color: "var(--fg1)",
									letterSpacing: "-0.02em",
								}}
							>
								{dMonthly.toLocaleString("fr-FR")}{" "}
								<span
									style={{ fontSize: 14, color: "var(--fg3)", fontWeight: 600 }}
								>
									DA
								</span>
							</div>
						</div>
						<div
							style={{
								padding: "20px 24px",
								background: "var(--brand-50)",
								borderRadius: 16,
								border: "1px solid #CFE3E7",
								position: "relative",
								overflow: "hidden",
							}}
						>
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									height: 4,
									background: "var(--brand-500)",
								}}
							/>
							<div
								style={{
									fontSize: 11,
									fontWeight: 600,
									color: "var(--brand-700)",
									textTransform: "uppercase",
									letterSpacing: "0.06em",
									marginBottom: 8,
								}}
							>
								Annuel
							</div>
							<div
								className="t-num"
								style={{
									fontSize: 28,
									fontWeight: 700,
									color: "var(--brand-900)",
									letterSpacing: "-0.02em",
								}}
							>
								{dAnnual.toLocaleString("fr-FR")}{" "}
								<span
									style={{
										fontSize: 14,
										color: "var(--brand-700)",
										fontWeight: 600,
									}}
								>
									DA
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
