import { BellRing, Clock } from "lucide-react";
import { getUpcomingStaffAlertsAction } from "@/actions/dashboard.actions";
import { formatTime } from "@/utils/format";

export default async function StaffAlertsWidget() {
	const alertsRes = await getUpcomingStaffAlertsAction({});
	const alerts = alertsRes.success ? alertsRes.data : [];

	if (alerts.length === 0) return null;

	return (
		<div className="col-span-1 md:col-span-12 bg-amber-50 border border-amber-200 rounded-[32px] p-6 shadow-sm">
			<div className="flex items-center gap-3 text-amber-700 mb-4">
				<div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center animate-pulse">
					<BellRing size={20} />
				</div>
				<div>
					<h3 className="text-lg font-black uppercase tracking-tighter">
						Alertes Opérationnelles
					</h3>
					<p className="text-xs font-bold opacity-60 uppercase tracking-widest">
						Sessions imminentes (&lt; 30 min)
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-4">
				{alerts.map((session: any) => (
					<div
						key={session.id}
						className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 flex-1 min-w-[280px]"
					>
						<div className="w-10 h-10 rounded-full bg-taysir-teal/10 flex items-center justify-center font-bold text-taysir-teal overflow-hidden">
							{session.instructor.avatarUrl ? (
								<img
									src={session.instructor.avatarUrl}
									alt={session.instructor.firstName}
									className="w-full h-full object-cover"
								/>
							) : (
								session.instructor.firstName[0]
							)}
						</div>
						<div className="flex-1">
							<div className="text-sm font-black text-taysir-teal">
								{session.instructor.firstName} {session.instructor.lastName}
							</div>
							<div className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest flex items-center gap-1">
								<Clock size={10} /> {formatTime(session.startTime)} •{" "}
								{session.activity.name} • {session.room.name}
							</div>
						</div>
						<div className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 uppercase tracking-tighter animate-pulse">
							Bientôt
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
