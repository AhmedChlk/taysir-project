import { cn } from "@/utils/format";

/* ==========================================================================
   TrendChart — histogramme mensuel en flex/CSS (aucune lib, aucun JS). Chaque
   colonne = un mois ; hauteur proportionnelle au max de la série. La dernière
   barre (période courante) est mise en avant. La valeur apparaît au survol
   (group-hover, CSS pur → server-safe). Pensé pour la trésorerie 6 mois.
   ========================================================================== */

export interface TrendPoint {
	/** Libellé d'axe déjà localisé (ex. « juil. »). */
	label: string;
	value: number;
}

export interface TrendChartProps {
	points: TrendPoint[];
	formatValue: (n: number) => string;
	/** Hauteur de la zone barres en px. */
	height?: number;
	className?: string;
	/** Nom accessible du graphe (lecteur d'écran). */
	ariaLabel?: string;
}

export const TrendChart = ({
	points,
	formatValue,
	height = 140,
	className,
	ariaLabel,
}: TrendChartProps) => {
	const max = Math.max(...points.map((p) => p.value), 1);

	// Résumé texte pour lecteurs d'écran (les barres visuelles sont aria-hidden) :
	// donne TOUTES les valeurs mensuelles — l'équivalent accessible du survol.
	const srSummary = `${ariaLabel ? `${ariaLabel}. ` : ""}${points
		.map((p) => `${p.label} : ${formatValue(p.value)}`)
		.join(", ")}`;

	return (
		<div className={cn("relative", className)}>
			<span className="sr-only">{srSummary}</span>
			<div className="flex items-end gap-2 sm:gap-3" aria-hidden>
				{points.map((p, i) => {
					const isLast = i === points.length - 1;
					const pct = Math.max(2, Math.round((p.value / max) * 100));
					return (
						<div
							key={p.label}
							className="group flex min-w-0 flex-1 flex-col items-center gap-2"
						>
							<div
								className="relative flex w-full items-end justify-center"
								style={{ height }}
							>
								{/* Valeur au survol (souris) */}
								<span className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
									{formatValue(p.value)}
								</span>
								<div
									className={cn(
										"w-full max-w-[44px] rounded-t-lg transition-all duration-500 ease-out",
										isLast
											? "bg-brand-500 group-hover:bg-brand-600"
											: "bg-brand-500/25 group-hover:bg-brand-500/40",
									)}
									style={{ height: `${pct}%` }}
								/>
							</div>
							<span
								className={cn(
									"truncate text-[10px] font-bold uppercase tracking-wide",
									isLast ? "text-brand-600" : "text-ink-500",
								)}
							>
								{p.label}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
