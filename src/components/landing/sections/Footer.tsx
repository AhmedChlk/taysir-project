import { Logo } from "../components/LandingLogo";

export const Footer = () => (
	<footer
		style={{ background: "#0F515C", color: "#fff", padding: "80px 0 40px" }}
	>
		<div
			style={{
				maxWidth: "var(--container)",
				margin: "0 auto",
				padding: "0 48px",
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1.5fr repeat(3, 1fr)",
					gap: 40,
					marginBottom: 56,
				}}
			>
				<div>
					<Logo textColor="#fff" color="#fff" />
					<p
						style={{
							marginTop: 16,
							fontSize: 14,
							color: "rgba(255,255,255,0.6)",
							maxWidth: 280,
						}}
					>
						La plateforme de gestion scolaire qui simplifie le quotidien de vos
						équipes.
					</p>
				</div>
				<div>
					<div
						style={{
							fontSize: 12,
							fontWeight: 600,
							color: "rgba(255,255,255,0.4)",
							textTransform: "uppercase",
							marginBottom: 16,
						}}
					>
						Produit
					</div>
					{["Fonctionnalités", "Tarifs", "Solutions"].map((l) => (
						<div
							key={l}
							style={{
								fontSize: 14,
								color: "rgba(255,255,255,0.7)",
								marginBottom: 8,
								cursor: "pointer",
							}}
						>
							{l}
						</div>
					))}
				</div>
				<div>
					<div
						style={{
							fontSize: 12,
							fontWeight: 600,
							color: "rgba(255,255,255,0.4)",
							textTransform: "uppercase",
							marginBottom: 16,
						}}
					>
						Ressources
					</div>
					{["Centre d'aide", "Documentation", "Contact"].map((l) => (
						<div
							key={l}
							style={{
								fontSize: 14,
								color: "rgba(255,255,255,0.7)",
								marginBottom: 8,
								cursor: "pointer",
							}}
						>
							{l}
						</div>
					))}
				</div>
				<div>
					<div
						style={{
							fontSize: 12,
							fontWeight: 600,
							color: "rgba(255,255,255,0.4)",
							textTransform: "uppercase",
							marginBottom: 16,
						}}
					>
						Légal
					</div>
					{["Confidentialité", "Conditions", "Mentions"].map((l) => (
						<div
							key={l}
							style={{
								fontSize: 14,
								color: "rgba(255,255,255,0.7)",
								marginBottom: 8,
								cursor: "pointer",
							}}
						>
							{l}
						</div>
					))}
				</div>
			</div>
			<div
				style={{
					borderTop: "1px solid rgba(255,255,255,0.1)",
					paddingTop: 24,
					fontSize: 13,
					color: "rgba(255,255,255,0.4)",
				}}
			>
				© 2026 Taysir. Tous droits réservés.
			</div>
		</div>
	</footer>
);
