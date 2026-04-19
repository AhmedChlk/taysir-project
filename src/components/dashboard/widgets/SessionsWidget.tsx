import { ArrowUpRight, Calendar, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { getTodaySessionsAction } from "@/actions/dashboard.actions";

export default async function SessionsWidget() {
	const response = await getTodaySessionsAction({});

	if (!response.success) {
		return (
			<div className="bento-card p-8 text-red-500">
				Erreur chargement séances.
			</div>
		);
	}

	const sessions = response.data;
	const uniqueRooms = new Set(sessions.map((s: any) => s.roomId)).size;

	return (
		<div className="col-span-1 md:col-span-4 bento-card p-8 flex flex-col justify-between group hover:border-taysir-teal/20 transition-all duration-500 shadow-sm hover:shadow-xl relative overflow-hidden">
			<div>
				<div className="flex justify-between items-start mb-8">
					<div className="flex items-center gap-3">
						<div className="p-4 bg-taysir-teal/5 rounded-2xl text-taysir-teal group-hover:bg-taysir-teal group-hover:text-white transition-all duration-500 shadow-sm">
							<Calendar size={24} />
						</div>
						<div>
							<span className="font-black text-sm uppercase tracking-tighter block leading-none text-taysir-teal">
								Planning
							</span>
							<span className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest mt-1 block">
								Activité en temps réel
							</span>
						</div>
					</div>
					<span className="text-taysir-light font-black text-[10px] flex items-center gap-1 bg-taysir-teal/5 px-3 py-1 rounded-full uppercase tracking-widest border border-taysir-teal/5">
						Aujourd&apos;hui
					</span>
				</div>

				<div className="mt-4">
					<div className="text-6xl font-black text-taysir-teal tracking-tighter mb-1 transition-transform group-hover:scale-105 origin-left">
						{sessions.length.toString().padStart(2, "0")}
					</div>
					<h3 className="text-lg font-bold text-taysir-teal/80 uppercase tracking-tighter">
						Séances programmées
					</h3>
					<div className="flex items-center gap-4 mt-3">
						<div className="flex items-center gap-1.5 text-xs font-bold text-taysir-teal/50 uppercase">
							<MapPin size={12} strokeWidth={2.5} /> {uniqueRooms} Salles
						</div>
						<div className="w-1 h-1 rounded-full bg-taysir-teal/20" />
						<div className="text-xs font-bold text-taysir-teal/50 uppercase">
							{sessions.length > 0 ? "Flux normal" : "Journée calme"}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-10 space-y-4 relative z-10">
				<div className="grid grid-cols-1 gap-3">
					<Link
						href="?drawer=sessions"
						className="flex items-center justify-between py-3.5 px-5 rounded-2xl bg-white border-2 border-taysir-teal/5 text-taysir-teal font-black text-[11px] uppercase tracking-widest hover:border-taysir-teal/20 hover:bg-taysir-teal/5 transition-all group/btn"
					>
						<span>Détails du planning</span>
						<ArrowUpRight
							size={16}
							className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
						/>
					</Link>
					<Link
						href="?drawer=new-session"
						className="flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-taysir-teal text-white font-black text-[11px] uppercase tracking-widest hover:shadow-lg hover:shadow-taysir-teal/20 hover:scale-[1.01] active:scale-95 transition-all"
					>
						<Plus size={16} strokeWidth={3} />
						<span>Planifier une séance</span>
					</Link>
				</div>
			</div>

			{/* Décoration de fond */}
			<div className="absolute -left-10 -bottom-10 w-40 h-40 bg-taysir-teal/[0.02] rounded-full blur-3xl group-hover:bg-taysir-teal/[0.05] transition-colors" />
		</div>
	);
}
