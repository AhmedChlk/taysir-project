"use client";

import { CountUp } from "../lib/CountUp";

export const KPIBand = () => {
	const kpi = (
		num: number,
		suffix: string,
		label: string,
		color = "#4ADE80",
	) => (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 4,
					marginBottom: 8,
				}}
			>
				<div
					className="t-num"
					style={{
						fontSize: 48,
						fontWeight: 700,
						letterSpacing: "-0.025em",
						color: "#fff",
					}}
				>
					<CountUp to={num} />
				</div>
				<div style={{ fontSize: 24, fontWeight: 700, color }}>{suffix}</div>
			</div>
			<div
				style={{
					fontSize: 14,
					color: "rgba(255,255,255,0.72)",
					lineHeight: 1.5,
					maxWidth: 220,
				}}
			>
				{label}
			</div>
		</div>
	);
	return (
		<section
			style={{
				background: "#0F515C",
				color: "#fff",
				padding: "64px 0",
				borderTop: "1px solid #0A434C",
			}}
		>
			<div
				style={{
					maxWidth: "var(--container)",
					margin: "0 auto",
					padding: "0 48px",
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 40,
				}}
			>
				{kpi(92, "%", "des élèves avec un parent notifié sous 5 min")}
				{kpi(7, " h/sem", "économisées par secrétaire, en moyenne", "#FBBF24")}
				{kpi(
					0,
					" conflit",
					"de salle ou d’intervenant sur 4 semaines",
					"#E6F2F4",
				)}
				{kpi(3, "x", "plus de paiements encaissés à l’échéance")}
			</div>
		</section>
	);
};
