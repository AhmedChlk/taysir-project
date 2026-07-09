"use client";

/* ==========================================================================
   HeroCopy — editorial left column.
   Deliberately sparse: an eyebrow scope row, one headline, one sentence, the
   CTA pair, and a single slim trust line. No stat wall — the live demo on the
   right carries the proof, the words carry the promise.
   ========================================================================== */

const MODULES = ["Élèves", "Paiements", "Présences", "Emploi du temps"];

export const HeroCopy = () => (
	<div>
		<p className="hero-modules">
			<span className="hero-modules-mark" />
			{MODULES.map((m, i) => (
				<span key={m} style={{ display: "inline-flex", alignItems: "center" }}>
					{m}
					{i < MODULES.length - 1 && <i>·</i>}
				</span>
			))}
		</p>

		<h1 className="hero-title">
			Reprenez la main sur les{" "}
			<span className="hero-title-accent">scolarités</span>
			<span className="hero-title-coda">sans courir après un seul parent.</span>
		</h1>

		<p className="hero-sub">
			Taysir réunit la gestion de votre école dans un seul outil pensé pour
			l’Algérie. Encaissez, suivez les impayés et relancez les parents sur
			WhatsApp — en quelques clics, montants en DA.
		</p>

		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: 12,
				marginBottom: 22,
			}}
		>
			<a href="#contact" className="btn btn--hero-primary">
				Demander une démo
				<span className="btn-arrow" aria-hidden>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M5 12h14M13 6l6 6-6 6" />
					</svg>
				</span>
			</a>
			<a href="#demo" className="btn btn--hero-secondary">
				<svg
					width="17"
					height="17"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden
				>
					<path d="M8 5v14l11-7z" />
				</svg>
				Voir la démo en action
			</a>
		</div>

		<p className="hero-trust">
			<span className="hero-trust-dot" />
			Conçu pour les écoles privées algériennes — essai sans carte bancaire.
		</p>
	</div>
);
