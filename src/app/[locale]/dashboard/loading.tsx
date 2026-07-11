import { Skeleton } from "@/components/ui/Skeleton";

/* Skeleton de route — rendu DANS DashboardLayout (déjà max-w-7xl px-* py-8),
   donc pas de wrapper de largeur/padding ici. Calque l'ordre et les grilles du
   DirectorCockpit (header → actions → finances 4+chart → école 3) pour éviter
   le reflow (CLS) au swap skeleton → contenu. */
export default function DashboardLoading() {
	return (
		<div className="space-y-8" aria-hidden>
			{/* PageHeader */}
			<div className="space-y-2">
				<Skeleton className="h-3 w-32 rounded-md" />
				<Skeleton className="h-10 w-96 max-w-full rounded-xl" />
				<Skeleton className="h-4 w-72 max-w-full rounded-md" />
			</div>

			{/* Actions rapides */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{["a", "b", "c"].map((k) => (
					<Skeleton key={k} className="h-14 rounded-2xl" />
				))}
			</div>

			{/* Finances — 4 KPI (1 en span-2) */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-24 rounded-md" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Skeleton className="h-24 rounded-2xl lg:col-span-2" />
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
				</div>
				<Skeleton className="h-56 rounded-2xl" />
			</div>

			{/* L'école — 3 KPI */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-20 rounded-md" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
				</div>
			</div>

			{/* Relances + Aujourd'hui */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Skeleton className="h-72 rounded-2xl lg:col-span-2" />
				<Skeleton className="h-72 rounded-2xl" />
			</div>
		</div>
	);
}
