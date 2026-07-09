"use client";

import { useEffect, useState } from "react";
import { Check } from "../components/LandingIcons";

export const MicroDemo = () => {
	const [active, setActive] = useState(1);
	useEffect(() => {
		const id = setInterval(() => setActive((a) => (a + 1) % 6), 2400);
		return () => clearInterval(id);
	}, []);

	const sessions = [
		{
			time: "08:00",
			subj: "Mathématiques",
			group: "3AS · A",
			teacher: "Pr. Benali",
			room: "Salle 4",
			tone: "done",
		},
		{
			time: "09:45",
			subj: "Physique",
			group: "2AS · B",
			teacher: "Pr. Kadri",
			room: "Salle 2",
			tone: "live",
		},
		{
			time: "10:30",
			subj: "Anglais",
			group: "1AS",
			teacher: "Pr. Yahia",
			room: "Salle 6",
			tone: "normal",
		},
		{
			time: "13:30",
			subj: "Français",
			group: "1AS · A",
			teacher: "Pr. Mansouri",
			room: "Salle 3",
			tone: "normal",
		},
		{
			time: "14:00",
			subj: "Sciences",
			group: "2AS · A",
			teacher: "Pr. Hamza",
			room: "Labo 1",
			tone: "conflict",
		},
		{
			time: "15:15",
			subj: "Préparation BAC",
			group: "Terminale",
			teacher: "Pr. Benali",
			room: "Salle 4",
			tone: "normal",
		},
	];

	return (
		<section id="produit" style={{ background: "#F9FAFB", padding: "120px 0" }}>
			<div
				style={{
					maxWidth: "var(--container)",
					margin: "0 auto",
					padding: "0 48px",
					display: "grid",
					gridTemplateColumns: "1.35fr 1fr",
					gap: 80,
					alignItems: "center",
				}}
			>
				<div
					style={{
						background: "#fff",
						borderRadius: 16,
						boxShadow: "var(--shadow-3)",
						overflow: "hidden",
						border: "1px solid rgba(15,81,92,0.08)",
						transform: "perspective(1600px) rotateY(1.5deg)",
					}}
				>
					<div
						style={{
							height: 38,
							background: "#F6F7F8",
							borderBottom: "1px solid #EEF1F3",
							display: "flex",
							alignItems: "center",
							padding: "0 12px",
							gap: 8,
						}}
					>
						<span
							style={{
								width: 10,
								height: 10,
								borderRadius: 999,
								background: "#F87171",
							}}
						/>
						<div
							style={{
								marginLeft: 16,
								background: "#fff",
								border: "1px solid #E5E7EB",
								borderRadius: 6,
								padding: "4px 12px",
								fontSize: 11,
								color: "var(--fg3)",
								minWidth: 320,
							}}
						>
							app.taysir.dz / emploi-du-temps
						</div>
					</div>
					<div style={{ padding: "22px 26px" }}>
						<div
							style={{
								borderBottom: "1px solid #EFF1F3",
								paddingBottom: 14,
								marginBottom: 16,
							}}
						>
							<div
								style={{ fontSize: 18, fontWeight: 700, color: "var(--fg1)" }}
							>
								Mardi 23 avril
							</div>
							<div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>
								6 séances · 4 salles · 184 élèves
							</div>
						</div>
						{sessions.map((s, i) => (
							<div
								key={i}
								style={{
									display: "grid",
									gridTemplateColumns: "60px 1fr 100px 90px",
									alignItems: "center",
									gap: 14,
									padding: "12px 10px",
									borderRadius: 10,
									background:
										i === active ? "rgba(26,122,137,0.06)" : "transparent",
									transition: "all 280ms var(--ease)",
								}}
							>
								<div
									style={{
										fontSize: 13,
										fontWeight: 700,
										color: i === active ? "var(--brand-900)" : "var(--fg1)",
									}}
								>
									{s.time}
								</div>
								<div>
									<div
										style={{
											fontSize: 14,
											fontWeight: 600,
											color: "var(--fg1)",
										}}
									>
										{s.subj}
									</div>
									<div style={{ fontSize: 11, color: "var(--fg3)" }}>
										{s.group}
									</div>
								</div>
								<div style={{ fontSize: 12, color: "var(--fg2)" }}>
									{s.room}
								</div>
								<span
									style={{
										fontSize: 10,
										fontWeight: 600,
										padding: "4px 9px",
										borderRadius: 999,
										background: i === active ? "var(--brand-50)" : "#F3F4F6",
										color: i === active ? "var(--brand-900)" : "var(--fg3)",
										justifySelf: "start",
									}}
								>
									{s.tone === "live"
										? "Live"
										: s.tone === "done"
											? "Terminé"
											: "À venir"}
								</span>
							</div>
						))}
					</div>
				</div>
				<div>
					<div className="t-eyebrow">Taysir pour les Secrétaires</div>
					<h2 style={{ margin: "12px 0 20px" }}>
						Plus jamais de conflits de salle, de doublons ou d'appels oubliés.
					</h2>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 18,
							fontSize: 16,
							color: "var(--fg2)",
							marginBottom: 32,
						}}
					>
						<div style={{ display: "flex", gap: 12 }}>
							<span
								style={{
									color: "var(--brand-500)",
									flexShrink: 0,
									marginTop: 3,
								}}
							>
								<Check size={18} />
							</span>
							<span>
								<b style={{ color: "var(--fg1)" }}>Planning en temps réel</b> —
								Détectez automatiquement les conflits de salle avant qu'ils
								n'arrivent.
							</span>
						</div>
						<div style={{ display: "flex", gap: 12 }}>
							<span
								style={{
									color: "var(--brand-500)",
									flexShrink: 0,
									marginTop: 3,
								}}
							>
								<Check size={18} />
							</span>
							<span>
								<b style={{ color: "var(--fg1)" }}>Appel en 30 secondes</b> —
								Présences marquées depuis le téléphone ; parents notifiés
								instantanément.
							</span>
						</div>
					</div>
					<div
						style={{
							borderLeft: "3px solid var(--brand-500)",
							paddingLeft: 18,
							marginTop: 28,
						}}
					>
						<p
							style={{
								margin: 0,
								fontSize: 15,
								fontStyle: "italic",
								color: "var(--fg1)",
							}}
						>
							« Avant Taysir, je passais mes lundis matin à recoller les emplois
							du temps sur papier. Aujourd'hui, c'est fait avant le café. »
						</p>
						<div style={{ marginTop: 12, fontSize: 13, color: "var(--fg3)" }}>
							<b style={{ color: "var(--fg1)" }}>Nadia B.</b> — Secrétaire,
							Alger
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
