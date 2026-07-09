"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Check } from "../components/LandingIcons";

export const Pricing = ({ locale }: { locale: string }) => {
	const [annual, setAnnual] = useState(true);
	const loginUrl = `/${locale}/login`;

	const plans = [
		{
			name: "Découverte",
			tagline: "Pour démarrer.",
			priceA: 0,
			priceM: 0,
			features: [
				"Jusqu'à 50 élèves",
				"3 intervenants",
				"Emploi du temps simple",
				"Support email",
			],
			cta: "Gratuit",
		},
		{
			name: "Essentiel",
			tagline: "Pour la plupart des écoles.",
			priceA: 120,
			priceM: 150,
			features: [
				"Élèves illimités",
				"Détection de conflits",
				"SMS parents",
				"Export comptable",
			],
			cta: "Essayer",
		},
		{
			name: "Pro",
			tagline: "Pour piloter et croître.",
			priceA: 220,
			priceM: 275,
			features: [
				"Tout Essentiel",
				"Tableaux de bord financiers",
				"Rapports IA",
				"Accompagnement dédié",
			],
			cta: "Essayer Pro",
			featured: true,
		},
	];

	return (
		<section
			id="tarifs"
			style={{
				background: "#fff",
				padding: "120px 0",
				borderTop: "1px solid #F3F4F6",
			}}
		>
			<div
				style={{
					maxWidth: "var(--container)",
					margin: "0 auto",
					padding: "0 48px",
				}}
			>
				<div style={{ textAlign: "center", marginBottom: 44 }}>
					<div className="t-eyebrow">Tarification</div>
					<h2 style={{ margin: "12px 0 20px" }}>
						Une tarification simple. Pas de surprise.
					</h2>
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 12,
							background: "#F3F4F6",
							padding: 4,
							borderRadius: 999,
						}}
					>
						<button
							onClick={() => setAnnual(false)}
							style={{
								padding: "6px 16px",
								borderRadius: 999,
								fontSize: 13,
								fontWeight: 600,
								background: !annual ? "#fff" : "transparent",
								boxShadow: !annual ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
							}}
						>
							Mensuel
						</button>
						<button
							onClick={() => setAnnual(true)}
							style={{
								padding: "6px 16px",
								borderRadius: 999,
								fontSize: 13,
								fontWeight: 600,
								background: annual ? "#fff" : "transparent",
								boxShadow: annual ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
							}}
						>
							Annuel
						</button>
					</div>
				</div>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr 1fr",
						gap: 24,
					}}
				>
					{plans.map((p) => (
						<div
							key={p.name}
							style={{
								padding: 32,
								borderRadius: 18,
								border: p.featured
									? "2px solid var(--brand-500)"
									: "1px solid #EEF1F3",
								background: "#fff",
								display: "flex",
								flexDirection: "column",
								position: "relative",
							}}
						>
							{p.featured && (
								<div
									style={{
										position: "absolute",
										top: -12,
										left: "50%",
										transform: "translateX(-50%)",
										background: "var(--brand-500)",
										color: "#fff",
										fontSize: 10,
										fontWeight: 700,
										padding: "4px 12px",
										borderRadius: 999,
									}}
								>
									RECOMMANDÉ
								</div>
							)}
							<div
								style={{ fontSize: 18, fontWeight: 700, color: "var(--fg1)" }}
							>
								{p.name}
							</div>
							<div style={{ margin: "16px 0 8px" }}>
								<span
									className="t-num"
									style={{ fontSize: 32, fontWeight: 700 }}
								>
									{annual ? p.priceA : p.priceM}
								</span>
								<span
									style={{ fontSize: 14, color: "var(--fg3)", marginLeft: 4 }}
								>
									DA/élève/mois
								</span>
							</div>
							<div
								style={{ fontSize: 12, color: "var(--fg3)", marginBottom: 24 }}
							>
								{p.tagline}
							</div>
							<Link
								href={loginUrl as Route}
								className={`btn ${p.featured ? "btn--primary" : "btn--ghost"} btn--md`}
								style={{ width: "100%" }}
							>
								{p.cta}
							</Link>
							<div
								style={{
									height: 1,
									background: "#EEF1F3",
									margin: "24px 0 16px",
								}}
							/>
							<div
								style={{ display: "flex", flexDirection: "column", gap: 10 }}
							>
								{p.features.map((f) => (
									<div
										key={f}
										style={{
											display: "flex",
											gap: 10,
											fontSize: 13,
											color: "var(--fg2)",
										}}
									>
										<Check size={14} color="var(--brand-500)" /> {f}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
