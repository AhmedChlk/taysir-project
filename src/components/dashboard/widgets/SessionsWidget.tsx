import { ArrowUpRight, Calendar, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTodaySessionsAction } from "@/actions/dashboard.actions";

type SessionData = { roomId: string | null };

export default async function SessionsWidget() {
	const t = await getTranslations();
	const response = await getTodaySessionsAction({});

	if (!response.success) {
		return (
			<div className="rounded-[24px] p-8 text-danger bg-rose-50 border border-rose-100">{t("stats_load_error")}</div>
		);
	}

	const sessions = response.data as SessionData[];
	const uniqueRooms = new Set(sessions.map((s) => s.roomId)).size;

	return (
		<div className="h-full bg-white rounded-[24px] border border-line p-8 shadow-sm flex flex-col justify-between group hover:shadow-ts-2 transition-all duration-300 relative overflow-hidden">
			<div className="relative z-10 flex flex-col h-full">
				<div className="flex items-center justify-between mb-8">
					<div className="p-3 bg-brand-50 rounded-xl text-brand-500 border border-brand-100 group-hover:bg-brand-500 group-hover:text-white transition-all duration-500 shadow-sm">
						<Calendar size={20} strokeWidth={2} />
					</div>
					<div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-brand-100 flex items-center gap-1.5">
						<div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
						{t("today_agenda")}
					</div>
				</div>

				<div className="mb-8 flex-1">
					<div className="text-4xl font-bold text-ink-900 tracking-tight transition-transform group-hover:scale-105 origin-left flex items-baseline gap-1.5 tabular-nums mb-2">
						{sessions.length.toString().padStart(2, "0")}
					</div>
					<span className="text-brand-500 text-sm font-bold uppercase tracking-widest block">
						Séances du jour
					</span>
				</div>

				<Link
					href="?drawer=new-session"
					className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-brand-700 shadow-lg shadow-brand-500/20"
				>
					<span>{t("sessions_planifier")}</span>
					<Plus size={16} strokeWidth={2.5} />
				</Link>
			</div>

			{/* Decorative Elements */}
			<div className="absolute -right-12 -bottom-12 w-48 h-48 bg-brand-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-brand-500/10 transition-colors duration-1000" />
		</div>
	);
}
