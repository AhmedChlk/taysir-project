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
		<div className="col-span-1 md:col-span-4 bento-card p-8 flex flex-col group hover:border-taysir-accent/20 transition-all duration-500 shadow-sm hover:shadow-xl relative overflow-hidden bg-gradient-to-br from-white to-taysir-bg/30">
			<div className="flex justify-between items-start mb-8 relative z-10">
				<div>
					<h3 className="text-sm font-black text-taysir-teal uppercase tracking-[0.2em] flex items-center gap-2">
						<Zap size={18} className="text-taysir-accent" />{" "}
						{t("kpi_widget_title")}
					</h3>
					<p className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest mt-1">
						{t("kpi_health_indicators")}
					</p>
				</div>
				<Link
					href="/dashboard/payments"
					className="p-2 bg-taysir-teal/5 rounded-xl text-taysir-teal hover:bg-taysir-teal hover:text-white transition-all"
				>
					<ArrowUpRight size={18} />
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-6 h-full relative z-10">
				{/* CA du Mois */}
				<div className="flex flex-col justify-between p-6 bg-white rounded-[24px] border border-taysir-teal/5 shadow-sm group/card hover:border-emerald-500/20 transition-all">
					<div className="flex justify-between items-start">
						<div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
							<Wallet size={16} />
						</div>
						<span className="text-[10px] font-black text-taysir-teal/30 uppercase tracking-widest">
							{t("kpi_monthly_revenue")}
						</span>
					</div>
					<div className="mt-4">
						<div className="text-4xl font-black text-taysir-teal tracking-tighter leading-none flex items-baseline gap-2">
							{finance.monthlyRevenue.toLocaleString("fr-DZ")}
							<span className="text-sm opacity-30 font-bold uppercase tracking-widest">
								{finance.currency}
							</span>
						</div>
						<div className="flex items-center gap-2 mt-2">
							<div className="h-1 flex-1 bg-emerald-100 rounded-full overflow-hidden">
								<div className="h-full bg-emerald-500 w-[70%] transition-all duration-1000" />
							</div>
							<span className="text-[10px] font-black text-emerald-600">
								{t("kpi_positive_flow")}
							</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					{/* Taux Présence */}
					<div className="p-5 bg-white rounded-[24px] border border-taysir-teal/5 shadow-sm hover:border-taysir-accent/20 transition-all">
						<div className="flex items-center gap-2 mb-2">
							<TrendingUp size={14} className="text-taysir-accent" />
							<span className="text-[9px] font-black text-taysir-teal/30 uppercase tracking-wider">
								{t("kpi_engagement")}
							</span>
						</div>
						<div className="text-2xl font-black text-taysir-teal">
							{attendance.ratio}%
						</div>
						<div className="mt-2 h-1 bg-taysir-teal/5 rounded-full overflow-hidden">
							<div
								className="h-full bg-taysir-accent"
								style={{ width: `${attendance.ratio}%` }}
							/>
						</div>
					</div>

					{/* Taux Occupation */}
					<div className="p-5 bg-white rounded-[24px] border border-taysir-teal/5 shadow-sm hover:border-taysir-teal/20 transition-all">
						<div className="flex items-center gap-2 mb-2">
							<DoorOpen size={14} className="text-taysir-teal" />
							<span className="text-[9px] font-black text-taysir-teal/30 uppercase tracking-wider">
								{t("kpi_occupation")}
							</span>
						</div>
						<div className="text-2xl font-black text-taysir-teal">
							{occupancy.rate}%
						</div>
						<div className="mt-2 h-1 bg-taysir-teal/5 rounded-full overflow-hidden">
							<div
								className="h-full bg-taysir-teal"
								style={{ width: `${occupancy.rate}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Mini Sparkline pour la tendance */}
				<div className="px-2">
					<AttendanceSparkline data={sparklineData} color="#1A7A89" />
					<p className="text-[8px] font-bold text-center text-taysir-teal/20 uppercase tracking-[0.3em] mt-2">
						{t("kpi_weekly_trend")}
					</p>
				</div>
			</div>

			{/* Décoration de fond subtle */}
			<div className="absolute right-[-20%] bottom-[-10%] w-60 h-60 bg-taysir-accent/5 rounded-full blur-3xl pointer-events-none" />
		</div>
	);
}
