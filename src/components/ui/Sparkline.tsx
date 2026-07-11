import { cn } from "@/utils/format";

/* ==========================================================================
   Sparkline — micro-graphe en SVG pur (aucune lib). Trace une série de
   nombres en aire + ligne, normalisée sur son min/max. Sans interactivité :
   server-safe. viewBox fixe + preserveAspectRatio="none" → s'étire à la
   largeur du parent ; le trait garde son épaisseur (non-scaling-stroke).
   ========================================================================== */

export interface SparklineProps {
	data: number[];
	/** Hauteur en px du rendu (le SVG reste responsive en largeur). */
	height?: number;
	className?: string;
	/** Classe Tailwind pour la couleur du trait/aire (via currentColor). */
	tone?: string;
}

const VB_W = 100;
const VB_H = 32;

export const Sparkline = ({
	data,
	height = 40,
	className,
	tone = "text-brand-500",
}: SparklineProps) => {
	if (data.length < 2) {
		return <div style={{ height }} className={className} aria-hidden />;
	}

	const max = Math.max(...data);
	const min = Math.min(...data);
	const span = max - min || 1;
	const stepX = VB_W / (data.length - 1);
	// Marge verticale de 2 unités pour ne pas coller aux bords.
	const y = (v: number) => VB_H - 2 - ((v - min) / span) * (VB_H - 4);

	const linePts = data.map((v, i) => `${i * stepX},${y(v)}`).join(" ");
	const areaPts = `0,${VB_H} ${linePts} ${VB_W},${VB_H}`;
	const lastX = (data.length - 1) * stepX;
	const lastY = y(data[data.length - 1] ?? 0);

	return (
		<svg
			viewBox={`0 0 ${VB_W} ${VB_H}`}
			preserveAspectRatio="none"
			style={{ height, width: "100%" }}
			className={cn("overflow-visible", tone, className)}
			aria-hidden
		>
			<polygon points={areaPts} fill="currentColor" opacity={0.1} />
			<polyline
				points={linePts}
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinejoin="round"
				strokeLinecap="round"
				vectorEffect="non-scaling-stroke"
			/>
			<circle
				cx={lastX}
				cy={lastY}
				r={2.5}
				fill="currentColor"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
};
