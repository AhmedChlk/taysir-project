import { ArrowUpRight, DoorOpen, TrendingUp, Wallet, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
	getAttendanceStatsAction,
	getDailyAttendanceRatioAction,
	getFinancialKPIsAction,
	getRoomOccupancyAction,
} from "@/actions/dashboard.actions";
import { Link } from "@/i18n/routing";
import AttendanceSparkline from "./AttendanceSparkline";

export default async function PerformanceKPIsWidget() {
	const t = await getTranslations();
	const [financeRes, attendanceRes, sparklineRes, occupancyRes] =
		await Promise.all([
			getFinancialKPIsAction({}),
			getDailyAttendanceRatioAction({}),
			getAttendanceStatsAction({}),
			getRoomOccupancyAction({}),
		]);

	const finance = financeRes.success
		? financeRes.data
		: { monthlyRevenue: 0, currency: "DZD" };
	const attendance = attendanceRes.success ? attendanceRes.data : { ratio: 0 };
	const sparklineData = sparklineRes.success
		? sparklineRes.data
		: [0, 0, 0, 0, 0, 0, 0];
	const occupancy = occupancyRes.success ? occupancyRes.data : { rate: 0 };

	return (
		<div className="h-full bg-white rounded-[24px] border border-line p-8 flex flex-col group shadow-sm hover:shadow-ts-2 transition-all duration-300 relative overflow-hidden">
			<div className="flex justify-between items-center mb-10 relative z-10">
				<div>
					<h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em] flex items-center gap-2">
						<Zap size={16} className="text-brand-500" strokeWidth={2.5} />{" "}
						{t("kpi_widget_title")}
					</h3>
				</div>
				<div className="flex items-center gap-2 text-ink-400 text-[10px] font-bold uppercase tracking-widest bg-surface-50 px-3 py-1.5 rounded-full border border-line">
					<span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
					Temps réel
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full relative z-10 flex-1">
				{/* Revenue Card */}
				<div className="p-6 bg-surface-50 rounded-2xl border border-line flex flex-col justify-between">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-2 bg-white rounded-xl text-success shadow-sm border border-line">
							<Wallet size={16} />
						</div>
						<span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
							{t("kpi_monthly_revenue")}
						</span>
					</div>
					<div>
						<div className="text-3xl font-bold text-ink-900 tracking-tight leading-none flex items-baseline gap-1.5 tabular-nums mb-4">
							{finance.monthlyRevenue.toLocaleString("fr-DZ")}
							<span className="text-xs text-ink-400 font-bold opacity-50">DA</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="h-1 flex-1 bg-success-50 rounded-full overflow-hidden">
								<div className="h-full bg-success w-[70%] rounded-full transition-all duration-1000" />
							</div>
						</div>
					</div>
				</div>

				{/* Engagement */}
				<div className="p-6 bg-surface-50 rounded-2xl border border-line flex flex-col justify-between">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-2 bg-white rounded-xl text-brand-500 shadow-sm border border-line">
							<TrendingUp size={16} />
						</div>
						<span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
							{t("kpi_engagement")}
						</span>
					</div>
					<div>
						<div className="text-3xl font-bold text-ink-900 tracking-tight leading-none tabular-nums mb-4">
							{attendance.ratio}%
						</div>
						<div className="flex items-center gap-3">
							<div className="h-1 flex-1 bg-brand-50 rounded-full overflow-hidden">
								<div
									className="h-full bg-brand-500 rounded-full"
									style={{ width: `${attendance.ratio}%` }}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Occupation */}
				<div className="p-6 bg-surface-50 rounded-2xl border border-line flex flex-col justify-between relative overflow-hidden">
					<div className="flex items-center gap-3 mb-6 relative z-10">
						<div className="p-2 bg-white rounded-xl text-amber-500 shadow-sm border border-line">
							<DoorOpen size={16} />
						</div>
						<span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
							{t("kpi_occupation")}
						</span>
					</div>
					<div className="relative z-10">
						<div className="text-3xl font-bold text-ink-900 tracking-tight leading-none tabular-nums mb-4">
							{occupancy.rate}%
						</div>
						<div className="flex items-center gap-3">
							<div className="h-1 flex-1 bg-amber-50 rounded-full overflow-hidden">
								<div
									className="h-full bg-amber-500 rounded-full"
									style={{ width: `${occupancy.rate}%` }}
								/>
							</div>
						</div>
					</div>
					<div className="absolute right-0 bottom-4 w-32 opacity-20">
						<AttendanceSparkline data={sparklineData} color="var(--brand-500)" />
					</div>
				</div>
			</div>
		</div>
	);
}
