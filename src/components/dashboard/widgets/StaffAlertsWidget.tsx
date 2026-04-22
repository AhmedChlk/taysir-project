import { BellRing, Clock } from "lucide-react";
import { getUpcomingStaffAlertsAction } from "@/actions/dashboard.actions";
import { formatTime } from "@/utils/format";

export default async function StaffAlertsWidget() {
	const alertsRes = await getUpcomingStaffAlertsAction({});
	const alerts = alertsRes.success ? alertsRes.data : [];

	if (alerts.length === 0) return null;

	return (
		<div className="col-span-1 md:col-span-12 bg-amber-50 border border-amber-200/50 rounded-[24px] p-6 shadow-sm mb-8">
			<div className="flex items-center gap-3 text-amber-900 mb-6">
				<div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-amber-200 shadow-sm animate-pulse">
					<BellRing size={20} className="text-amber-600" />
				</div>
				<div>
					<h3 className="text-sm font-bold uppercase tracking-widest">
						Alertes Opérationnelles
					</h3>
					<p className="text-xs font-medium text-amber-700/70 uppercase tracking-widest">
						Sessions imminentes (&lt; 30 min)
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-4">
				{alerts.map((session) => (
					<div
						key={session.id}
						className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center gap-4 flex-1 min-w-[300px] hover:shadow-md transition-shadow"
					>
						<div className="w-12 h-12 rounded-full bg-surface-50 border border-line flex items-center justify-center font-bold text-brand-900 overflow-hidden shadow-inner shrink-0">
							{session.instructor.avatarUrl ? (
								<img
									src={session.instructor.avatarUrl}
									alt={session.instructor.firstName}
									className="w-full h-full object-cover"
								/>
							) : (
								<span className="text-sm">{session.instructor.firstName[0]}{session.instructor.lastName[0]}</span>
							)}
						</div>
						<div className="flex-1 overflow-hidden">
							<div className="text-sm font-bold text-ink-900 truncate">
								{session.instructor.firstName} {session.instructor.lastName}
							</div>
							<div className="text-[11px] font-bold text-ink-400 uppercase tracking-tight flex items-center gap-1.5 mt-1">
								<Clock size={12} className="text-brand-500" /> {formatTime(session.startTime)} •{" "}
								<span className="truncate">{session.activity.name}</span>
							</div>
						</div>
						<div className="text-[10px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest shrink-0">
							Bientôt
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
