import { ArrowRight, FileText, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDashboardStatsAction } from "@/actions/dashboard.actions";
import { Link } from "@/i18n/routing";

export default async function StatsWidget() {
	const t = await getTranslations();
	const response = await getDashboardStatsAction({});

	if (!response.success) {
		return (
			<div className="rounded-[24px] p-8 text-danger bg-rose-50 border border-rose-100">{t("stats_load_error")}</div>
		);
	}

	const { total, active } = response.data;

	return (
		<div className="h-full bg-brand-900 rounded-[24px] p-8 text-white relative overflow-hidden shadow-ts-3 flex flex-col justify-between group">
			<div className="relative z-10 flex flex-col h-full">
				<div className="flex items-center justify-between mb-8">
					<div className="p-3 bg-white/10 rounded-xl text-white backdrop-blur-md border border-white/10">
						<Users size={20} strokeWidth={2} />
					</div>
					<div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
						<div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
						<span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
							{active} Actifs
						</span>
					</div>
				</div>

				<div className="mb-8 flex-1">
					<h2 className="text-6xl font-bold tracking-tighter leading-none mb-2">
						{total.toString().padStart(2, "0")}
					</h2>
					<span className="text-white/60 text-sm font-bold uppercase tracking-widest block">
						Élèves Inscrits
					</span>
				</div>

				<Link
					href="/dashboard/students"
					className="w-full py-4 bg-white text-brand-900 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-surface-50 hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-900/20"
				>
					<span>Accéder à la base</span>
					<ArrowRight size={16} />
				</Link>
			</div>

			{/* Decorative Elements */}
			<div className="absolute -right-12 -top-12 w-48 h-48 bg-brand-500/30 rounded-full blur-[60px] pointer-events-none group-hover:bg-brand-500/40 transition-colors duration-1000" />
			<div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-[60px] pointer-events-none" />
		</div>
	);
}
