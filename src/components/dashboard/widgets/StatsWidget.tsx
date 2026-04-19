import { ArrowRight, FileText, Users } from "lucide-react";
import { getDashboardStatsAction } from "@/actions/dashboard.actions";
import { Link } from "@/i18n/routing";

export default async function StatsWidget() {
	const response = await getDashboardStatsAction({});

	if (!response.success) {
		return (
			<div className="bento-card p-8 text-red-500">
				Erreur lors du chargement des statistiques.
			</div>
		);
	}

	const { total, active } = response.data;

	return (
		<div className="col-span-1 md:col-span-8 bg-taysir-teal rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl group">
			<div className="relative z-10 h-full flex flex-col justify-between">
				<div>
					<div className="flex items-center gap-2 opacity-70 mb-6">
						<div className="p-2 bg-white/10 rounded-lg">
							<Users size={20} />
						</div>
						<span className="text-sm font-black uppercase tracking-[0.2em]">
							Pilotage Effectifs
						</span>
					</div>

					<div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
						<h2 className="text-8xl md:text-9xl font-black tracking-tighter leading-none">
							{total.toString().padStart(2, "0")}
						</h2>
						<div className="mb-2">
							<span className="text-white/40 text-2xl md:text-3xl font-black uppercase tracking-tighter block leading-none italic">
								Inscrits
							</span>
							<div className="flex gap-2 mt-2">
								<div className="flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border border-emerald-400/20">
									<div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
									{active} Actifs
								</div>
								<div className="flex items-center gap-1.5 bg-white/10 text-white/60 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border border-white/10">
									{total - active} Archives
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-16 flex flex-wrap gap-3">
					<Link
						href="/dashboard/students"
						className="bg-white text-taysir-teal px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-white/10 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
					>
						<span>Base de données élèves</span>
						<ArrowRight size={16} />
					</Link>
					<Link
						href="/dashboard/attendance"
						className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2"
					>
						<FileText size={16} />
						<span>Feuilles d&apos;appel</span>
					</Link>
				</div>
			</div>

			{/* Décoration de fond premium */}
			<div className="absolute -right-20 -top-20 w-96 h-96 bg-taysir-accent/30 rounded-full blur-[100px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
			<div className="absolute right-12 bottom-12 opacity-5 scale-150 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
				<Users size={300} strokeWidth={1} />
			</div>
		</div>
	);
}
