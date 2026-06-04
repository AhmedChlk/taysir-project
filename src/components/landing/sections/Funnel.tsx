"use client";

import { useState } from "react";
import { ArrowR, Check } from "../components/LandingIcons";
import { DemoButton } from "../lib/DemoCta";
import { Reveal } from "../lib/Reveal";

const wrap = {
	maxWidth: "var(--container)",
	margin: "0 auto",
	padding: "0 48px",
} as const;

const eyebrow = {
	fontSize: 13,
	fontWeight: 700,
	letterSpacing: "0.1em",
	textTransform: "uppercase",
	color: "var(--brand-500)",
} as const;

const h2 = {
	fontSize: 42,
	lineHeight: 1.1,
	fontWeight: 700,
	letterSpacing: "-0.025em",
	color: "var(--fg1)",
	margin: "12px 0 0",
} as const;

/* ============================ PROBLEM ============================ */

const PAINS = [
	{
		title: "Registres papier",
		desc: "Présences et inscriptions sur papier — perdus, illisibles, impossibles à analyser.",
	},
	{
		title: "Fichiers Excel dispersés",
		desc: "Chaque secrétaire sa version. Données en double, erreurs, aucune source unique.",
	},
	{
		title: "Relances manuelles",
		desc: "Appels et SMS un par un aux parents pour les absences et les retards de paiement.",
	},
	{
		title: "Paiements suivis à la main",
		desc: "Qui a payé quoi ? Tranches en retard oubliées, trésorerie dans le flou.",
	},
];

export function Problem() {
	return (
		<section
			id="probleme"
			style={{
				background: "#FCF8F5",
				padding: "110px 0",
				borderTop: "1px solid #F1E9E2",
			}}
		>
			<div style={wrap}>
				<Reveal>
					<div style={{ maxWidth: 640 }}>
						<div style={{ ...eyebrow, color: "#C2410C" }}>
							Le quotidien sans Taysir
						</div>
						<h2 style={h2}>
							Gérer une école à la main,
							<br />
							c'est perdre du temps et de l'argent.
						</h2>
					</div>
				</Reveal>
				<Reveal stagger className="taysir-pain-grid" as="ul">
					{PAINS.map((p) => (
						<li
							key={p.title}
							style={{
								listStyle: "none",
								background: "#fff",
								border: "1px solid #F0E2D8",
								borderRadius: 16,
								padding: 24,
							}}
						>
							<div
								style={{
									width: 38,
									height: 38,
									borderRadius: 10,
									background: "#FEE2E2",
									color: "#DC2626",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 20,
									fontWeight: 700,
									marginBottom: 14,
								}}
								aria-hidden
							>
								✕
							</div>
							<div
								style={{ fontSize: 17, fontWeight: 600, color: "var(--fg1)" }}
							>
								{p.title}
							</div>
							<p
								style={{
									fontSize: 14,
									color: "var(--fg2)",
									margin: "8px 0 0",
									lineHeight: 1.5,
								}}
							>
								{p.desc}
							</p>
						</li>
					))}
				</Reveal>
			</div>
		</section>
	);
}

/* ========================= HOW IT WORKS ========================= */

const STEPS = [
	{
		n: "01",
		title: "Importez vos données",
		desc: "Élèves, groupes et personnel en CSV ou en quelques clics. Opérationnel dès le premier jour.",
	},
	{
		n: "02",
		title: "Gérez au quotidien",
		desc: "Présences, emplois du temps, paiements et documents — centralisés, en temps réel, accessibles à toute l'équipe.",
	},
	{
		n: "03",
		title: "Pilotez & décidez",
		desc: "Tableaux de bord, relances automatiques aux parents, suivi de trésorerie. Vous gardez le contrôle.",
	},
];

export function HowItWorks() {
	return (
		<section id="demarrage" style={{ background: "#fff", padding: "120px 0" }}>
			<div style={wrap}>
				<Reveal>
					<div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
						<div style={eyebrow}>Comment ça marche</div>
						<h2 style={h2}>Opérationnel en 3 étapes</h2>
						<p style={{ fontSize: 18, color: "var(--fg2)", marginTop: 16 }}>
							Pas de migration complexe. Pas de formation interminable. Vous
							démarrez vite.
						</p>
					</div>
				</Reveal>
				<Reveal stagger className="taysir-steps-grid">
					{STEPS.map((s) => (
						<div
							key={s.n}
							style={{
								background: "var(--surface-50, #F9FAFB)",
								border: "1px solid #EEF1F3",
								borderRadius: 18,
								padding: 32,
							}}
						>
							<div
								style={{
									fontSize: 38,
									fontWeight: 700,
									color: "var(--brand-100, #CFE3E7)",
									letterSpacing: "-0.03em",
								}}
							>
								{s.n}
							</div>
							<div
								style={{
									fontSize: 20,
									fontWeight: 600,
									color: "var(--fg1)",
									marginTop: 8,
								}}
							>
								{s.title}
							</div>
							<p
								style={{
									fontSize: 15,
									color: "var(--fg2)",
									margin: "10px 0 0",
									lineHeight: 1.55,
								}}
							>
								{s.desc}
							</p>
						</div>
					))}
				</Reveal>
			</div>
		</section>
	);
}

/* ============================== FAQ ============================== */

const FAQS = [
	{
		q: "Combien de temps pour démarrer ?",
		a: "La plupart des établissements sont opérationnels en moins d'une journée. On vous accompagne pour l'import de vos élèves et groupes.",
	},
	{
		q: "Mes données sont-elles sécurisées et isolées ?",
		a: "Oui. Chaque établissement est totalement isolé (architecture multi-tenant) : vos données ne sont jamais visibles par un autre établissement.",
	},
	{
		q: "Taysir fonctionne avec une connexion faible ?",
		a: "La plateforme est optimisée pour être légère et rapide, même sur des connexions modestes. Aucune installation lourde requise.",
	},
	{
		q: "Le support et l'interface existent en arabe ?",
		a: "Oui, l'interface est entièrement bilingue français / arabe avec support RTL natif.",
	},
	{
		q: "Je migre depuis Excel, c'est possible ?",
		a: "Tout à fait. On importe vos fichiers Excel/CSV existants pour que vous ne repartiez pas de zéro.",
	},
	{
		q: "Y a-t-il un engagement ?",
		a: "Vous commencez par une démo et un essai. Sans carte bancaire, sans engagement de départ.",
	},
];

export function Faq() {
	const [open, setOpen] = useState<number | null>(0);
	return (
		<section id="faq" style={{ background: "#F9FAFB", padding: "120px 0" }}>
			<div style={{ ...wrap, maxWidth: 820 }}>
				<Reveal>
					<div style={{ textAlign: "center" }}>
						<div style={eyebrow}>Questions fréquentes</div>
						<h2 style={h2}>Tout ce qu'on vous demande</h2>
					</div>
				</Reveal>
				<Reveal stagger>
					{FAQS.map((f, i) => {
						const isOpen = open === i;
						return (
							<div
								key={f.q}
								style={{
									background: "#fff",
									border: "1px solid #EEF1F3",
									borderRadius: 14,
									marginTop: 12,
									overflow: "hidden",
								}}
							>
								<button
									type="button"
									onClick={() => setOpen(isOpen ? null : i)}
									aria-expanded={isOpen}
									style={{
										width: "100%",
										textAlign: "left",
										background: "none",
										border: "none",
										cursor: "pointer",
										padding: "20px 24px",
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: 16,
										fontSize: 16,
										fontWeight: 600,
										color: "var(--fg1)",
									}}
								>
									{f.q}
									<span
										style={{
											flexShrink: 0,
											transition: "transform 0.25s",
											transform: isOpen ? "rotate(45deg)" : "none",
											color: "var(--brand-500)",
											fontSize: 22,
											lineHeight: 1,
										}}
										aria-hidden
									>
										+
									</span>
								</button>
								{isOpen && (
									<p
										style={{
											padding: "0 24px 22px",
											margin: 0,
											fontSize: 15,
											lineHeight: 1.6,
											color: "var(--fg2)",
										}}
									>
										{f.a}
									</p>
								)}
							</div>
						);
					})}
				</Reveal>
			</div>
		</section>
	);
}

/* =========================== FINAL CTA =========================== */

export function FinalCta() {
	return (
		<section style={{ background: "#0F515C", padding: "110px 0" }}>
			<div style={{ ...wrap, textAlign: "center", maxWidth: 720 }}>
				<Reveal>
					<div>
						<h2
							style={{
								fontSize: 44,
								lineHeight: 1.1,
								fontWeight: 700,
								letterSpacing: "-0.025em",
								color: "#fff",
								margin: 0,
							}}
						>
							Reprenez le contrôle de votre école.
						</h2>
						<p
							style={{
								fontSize: 19,
								color: "rgba(255,255,255,0.75)",
								margin: "18px auto 32px",
								maxWidth: 520,
							}}
						>
							Réservez une démo gratuite. Un conseiller vous montre Taysir sur
							le cas concret de votre établissement.
						</p>
						<div
							style={{
								display: "flex",
								gap: 14,
								justifyContent: "center",
								flexWrap: "wrap",
							}}
						>
							<DemoButton className="btn btn--lg">
								Réserver une démo <ArrowR size={18} />
							</DemoButton>
						</div>
						<div
							style={{
								display: "flex",
								gap: 22,
								marginTop: 28,
								justifyContent: "center",
								fontSize: 14,
								color: "rgba(255,255,255,0.7)",
								flexWrap: "wrap",
							}}
						>
							<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<Check size={15} color="#7FD4C1" /> Sans carte bancaire
							</span>
							<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<Check size={15} color="#7FD4C1" /> Réponse sous 24h
							</span>
							<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<Check size={15} color="#7FD4C1" /> Support FR / AR
							</span>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
