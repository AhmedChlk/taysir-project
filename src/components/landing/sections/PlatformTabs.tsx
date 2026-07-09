"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Check } from "../components/LandingIcons";

export const PlatformTabs = () => {
	const tabs = [
		{
			id: "ger",
			label: "Pour les Gérants",
			title: "Piloter, pas subir.",
			body: "Tableau de bord financier consolidé, alertes en temps réel sur les impayés, et vue d’ensemble de chaque salle, chaque séance, chaque équipe.",
			bullets: [
				"Tableau de bord consolidé — revenus, présences, capacité",
				"Alertes sur les impayés et les retards d’inscription",
				"Permissions fines sur chaque rôle et chaque module",
				"Export comptable aux formats algériens",
			],
		},
		{
			id: "sec",
			label: "Pour les Secrétaires",
			title: "Le quotidien, simplifié.",
			body: "Inscriptions, affectations, planning des salles, encaissements : tout se fait depuis une seule interface, sans double saisie.",
			bullets: [
				"Dossier d’inscription en 3 minutes",
				"Détection automatique des conflits de planning",
				"Encaissements par tranches avec reçu automatique",
				"Relances de paiement et d’absence en un clic",
			],
		},
		{
			id: "prof",
			label: "Pour les Intervenants",
			title: "Enseigner, pas administrer.",
			body: "L’appel en 30 secondes depuis le téléphone, les remarques pédagogiques sauvegardées, l’emploi du temps toujours à jour.",
			bullets: [
				"Emploi du temps personnel sur mobile",
				"Appel des présences tactile, hors-ligne",
				"Remarques pédagogiques liées au dossier élève",
				"Notifications instantanées en cas d’annulation",
			],
		},
	];
	const [active, setActive] = useState("ger");
	const tab = tabs.find((t) => t.id === active)!;

	return (
		<section
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
				<div style={{ textAlign: "center" }}>
					<h2
						style={{
							fontSize: 44,
							letterSpacing: "-0.025em",
							margin: "0 auto",
							maxWidth: 800,
						}}
					>
						Une plateforme.{" "}
						<span style={{ color: "var(--fg3)" }}>
							Trois rôles. Zéro friction.
						</span>
					</h2>
				</div>
				<div
					style={{
						display: "flex",
						gap: 4,
						justifyContent: "center",
						marginTop: 40,
						flexWrap: "wrap",
					}}
				>
					{tabs.map((t) => (
						<button
							key={t.id}
							onClick={() => setActive(t.id)}
							style={{
								padding: "10px 20px",
								borderRadius: 999,
								border: "1px solid transparent",
								background: t.id === active ? "var(--brand-50)" : "transparent",
								color: t.id === active ? "var(--brand-900)" : "var(--fg2)",
								fontWeight: t.id === active ? 700 : 500,
								fontSize: 14,
								cursor: "pointer",
								transition: "all 220ms var(--ease)",
							}}
						>
							{t.label}
						</button>
					))}
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={active}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
						style={{
							marginTop: 40,
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 72,
							alignItems: "center",
						}}
					>
						<div>
							<h3
								style={{
									fontSize: 32,
									letterSpacing: "-0.02em",
									margin: "0 0 16px",
								}}
							>
								{tab.title}
							</h3>
							<p
								style={{
									fontSize: 17,
									color: "var(--fg2)",
									lineHeight: 1.6,
									margin: "0 0 24px",
								}}
							>
								{tab.body}
							</p>
							<div
								style={{ display: "flex", flexDirection: "column", gap: 12 }}
							>
								{tab.bullets.map((b) => (
									<div
										key={b}
										style={{
											display: "flex",
											gap: 10,
											alignItems: "flex-start",
											fontSize: 15,
											color: "var(--fg1)",
										}}
									>
										<span
											style={{
												color: "var(--brand-500)",
												flexShrink: 0,
												marginTop: 3,
											}}
										>
											<Check size={16} />
										</span>
										{b}
									</div>
								))}
							</div>
						</div>
						<div
							style={{
								background: "linear-gradient(135deg,#E6F2F4 0%,#F9FAFB 100%)",
								borderRadius: 20,
								padding: 32,
								minHeight: 360,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								border: "1px solid #E5E7EB",
							}}
						>
							<div
								style={{
									background: "#fff",
									borderRadius: 14,
									padding: "20px 22px",
									boxShadow: "var(--shadow-2)",
									border: "1px solid rgba(15,81,92,0.06)",
									width: "100%",
									maxWidth: 380,
								}}
							>
								{active === "ger" && (
									<>
										<div
											style={{
												fontSize: 11,
												fontWeight: 600,
												color: "var(--fg3)",
												letterSpacing: "0.08em",
												textTransform: "uppercase",
											}}
										>
											Avril · Total
										</div>
										<div
											className="t-num"
											style={{
												fontSize: 34,
												fontWeight: 700,
												color: "var(--brand-900)",
												letterSpacing: "-0.02em",
												marginTop: 6,
											}}
										>
											2 480 000 DA
										</div>
										<div
											style={{
												fontSize: 12,
												color: "#15803D",
												fontWeight: 600,
												marginTop: 4,
											}}
										>
											+18 % vs mars
										</div>
										<div
											style={{
												height: 1,
												background: "#EEF1F3",
												margin: "18px 0",
											}}
										/>
										<div
											style={{
												display: "flex",
												alignItems: "flex-end",
												gap: 8,
												height: 80,
											}}
										>
											{[40, 55, 42, 68, 72, 55, 82, 65, 90, 76, 85, 94].map(
												(h, i) => (
													<div
														key={i}
														style={{
															flex: 1,
															height: `${h}%`,
															background:
																i === 11 ? "var(--brand-500)" : "#CFE3E7",
															borderRadius: "4px 4px 0 0",
														}}
													/>
												),
											)}
										</div>
									</>
								)}
								{active === "sec" && (
									<>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												marginBottom: 14,
											}}
										>
											<div
												style={{
													fontSize: 14,
													fontWeight: 700,
													color: "var(--fg1)",
												}}
											>
												Inscription — Belkacem A.
											</div>
											<span
												style={{
													fontSize: 10,
													fontWeight: 600,
													padding: "4px 8px",
													borderRadius: 999,
													background: "#DCFCE7",
													color: "#15803D",
												}}
											>
												Complet
											</span>
										</div>
										{[
											"Infos personnelles",
											"Groupe & intervenant",
											"Paiements",
											"Documents",
										].map((s, i) => (
											<div
												key={s}
												style={{
													display: "flex",
													alignItems: "center",
													gap: 10,
													padding: "10px 0",
													borderBottom: i < 3 ? "1px solid #EEF1F3" : "none",
												}}
											>
												<span
													style={{
														width: 20,
														height: 20,
														borderRadius: 999,
														background: i < 3 ? "var(--brand-500)" : "#E5E7EB",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													{i < 3 ? (
														<Check size={11} color="#fff" strokeWidth={3} />
													) : (
														<span
															style={{
																fontSize: 10,
																color: "var(--fg3)",
																fontWeight: 700,
															}}
														>
															{i + 1}
														</span>
													)}
												</span>
												<span
													style={{
														fontSize: 13,
														color: "var(--fg1)",
														fontWeight: i === 3 ? 600 : 500,
													}}
												>
													{s}
												</span>
											</div>
										))}
									</>
								)}
								{active === "prof" && (
									<>
										<div
											style={{
												fontSize: 11,
												fontWeight: 600,
												color: "var(--fg3)",
												letterSpacing: "0.08em",
												textTransform: "uppercase",
											}}
										>
											Appel · Maths 3AS-A
										</div>
										<div
											style={{
												display: "grid",
												gridTemplateColumns: "1fr 1fr 1fr",
												gap: 6,
												marginTop: 14,
											}}
										>
											{Array.from({ length: 9 }).map((_, i) => (
												<div
													key={i}
													style={{
														padding: "8px",
														borderRadius: 8,
														background:
															i % 4 !== 0
																? "rgba(26,122,137,0.1)"
																: "rgba(220,38,38,0.08)",
														color: i % 4 !== 0 ? "var(--brand-700)" : "#B91C1C",
														textAlign: "center",
														fontSize: 10,
														fontWeight: 600,
														border: "1px solid rgba(0,0,0,0.05)",
													}}
												>
													{i % 4 !== 0 ? "Présent" : "Absent"}
												</div>
											))}
										</div>
									</>
								)}
							</div>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	);
};
