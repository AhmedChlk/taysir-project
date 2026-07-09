import {
	AlertCircle,
	ArrowRight,
	CalendarClock,
	CalendarPlus,
	CheckCircle2,
	ClipboardCheck,
	ClipboardList,
	Clock,
	GraduationCap,
	TriangleAlert,
	UserCog,
	UserPlus,
	Users,
	Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getDirectorOverviewAction } from "@/actions/dashboard.actions";
import { RelanceButton } from "@/components/dashboard/payments/RelanceButton";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Card, PageHeader, StatCard } from "@/components/ui/primitives";
import { Link } from "@/i18n/routing";
import { localizedGroup, localizedSubject } from "@/lib/subjects";
import {
	buildRelanceMessage,
	buildWaUrl,
	normalizeDzPhone,
} from "@/lib/wa-relance";
import { getCurrentTenant } from "@/services/api";
import { formatCurrency } from "@/utils/format";

const QUICK_ACTIONS = [
	{
		href: "/dashboard/payments",
		labelKey: "quick_collect_payment",
		icon: Wallet,
		tone: "bg-brand-500 text-white",
	},
	{
		href: "/dashboard/schedule?drawer=new-session",
		labelKey: "quick_plan_session",
		icon: CalendarPlus,
		tone: "bg-surface-white text-ink-900 border border-line",
	},
	{
		href: "/dashboard/students",
		labelKey: "quick_enroll_student",
		icon: UserPlus,
		tone: "bg-surface-white text-ink-900 border border-line",
	},
] as const;

// Ajoutée seulement si le gérant enseigne lui-même (cf. overview.teaches).
const TEACH_ACTION = {
	href: "/dashboard/attendance",
	labelKey: "quick_take_attendance",
	icon: ClipboardCheck,
	tone: "bg-surface-white text-ink-900 border border-line",
} as const;

export default async function DirectorCockpit() {
	const t = await getTranslations();
	const locale = await getLocale();
	const dateLocale = locale === "ar" ? "ar-DZ" : "fr-FR";
	const [res, tenant] = await Promise.all([
		getDirectorOverviewAction({}),
		getCurrentTenant(),
	]);
	if (!res.success) {
		return (
			<Card>
				<p className="text-sm text-ink-500">{t("dashboard_load_error")}</p>
			</Card>
		);
	}
	const d = res.data;
	// Le gérant qui enseigne aussi voit l'appel ; sinon non (il supervise).
	const quickActions = d.teaches
		? [...QUICK_ACTIONS, TEACH_ACTION]
		: QUICK_ACTIONS;
	const school = tenant?.name ?? t("default_school_name");
	const today = new Date().toLocaleDateString(dateLocale, {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("director_eyebrow")}
				title={t("director_title")}
				accent={school}
				subtitle={`${today} — ${t("director_subtitle")}`}
			/>

			{/* Actions rapides — 1 clic chacune */}
			<div
				className={`grid grid-cols-1 gap-3 duration-500 animate-in fade-in slide-in-from-bottom-2 ${
					quickActions.length === 4
						? "sm:grid-cols-2 lg:grid-cols-4"
						: "sm:grid-cols-3"
				}`}
			>
				{quickActions.map((a, i) => (
					<Link
						key={a.href}
						href={a.href}
						style={{
							animationDelay: `${i * 60}ms`,
							animationFillMode: "backwards",
						}}
						className={`group flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold shadow-ts-1 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:shadow-ts-2 active:translate-y-0 active:scale-[0.98] ${a.tone}`}
					>
						<a.icon
							size={20}
							className="transition-transform duration-200 group-hover:scale-110"
						/>
						<span className="flex-1">{t(a.labelKey)}</span>
						<ArrowRight
							size={16}
							className="opacity-50 transition-transform group-hover:translate-x-1 rtl:rotate-180"
						/>
					</Link>
				))}
			</div>

			{/* KPIs — argent d'abord, reste à recouvrer en focal */}
			<div
				style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
				className="grid grid-cols-1 gap-4 duration-500 animate-in fade-in slide-in-from-bottom-2 md:grid-cols-2 lg:grid-cols-4"
			>
				<div className="lg:col-span-2">
					<StatCard
						label={t("kpi_remaining_to_collect")}
						value={
							<AnimatedNumber value={d.finance.resteARecouvrer} suffix=" DA" />
						}
						icon={<AlertCircle size={22} />}
						tone={d.finance.resteARecouvrer > 0 ? "danger" : "positive"}
						hint={
							d.recouvrement.count > 0
								? `${d.recouvrement.count} ${t("students_late_suffix")}`
								: t("kpi_up_to_date")
						}
					/>
				</div>
				<StatCard
					label={t("kpi_collected_month")}
					value={
						<AnimatedNumber value={d.finance.encaisseCeMois} suffix=" DA" />
					}
					icon={<CheckCircle2 size={22} />}
					tone="positive"
				/>
				<StatCard
					label={t("kpi_collection_rate")}
					value={
						<AnimatedNumber value={d.finance.tauxRecouvrement} suffix=" %" />
					}
					icon={<Wallet size={22} />}
					tone="brand"
					hint={
						<span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
							<span
								className="block h-full rounded-full bg-brand-500 transition-[width] duration-700 ease-out"
								style={{
									width: `${Math.min(100, Math.max(0, d.finance.tauxRecouvrement))}%`,
								}}
							/>
						</span>
					}
				/>
			</div>

			{/* KPIs « people » — l'école en un coup d'œil (données déjà calculées). */}
			<div
				style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
				className="grid grid-cols-1 gap-4 duration-500 animate-in fade-in slide-in-from-bottom-2 md:grid-cols-3"
			>
				<StatCard
					label={t("kpi_active_students")}
					value={<AnimatedNumber value={d.students.active} />}
					icon={<GraduationCap size={22} />}
					hint={
						d.students.total > d.students.active
							? `${d.students.total - d.students.active} ${t("inactive_suffix")}`
							: t("kpi_all_active")
					}
				/>
				<StatCard
					label={t("staff")}
					value={<AnimatedNumber value={d.staffCount} />}
					icon={<UserCog size={22} />}
				/>
				<StatCard
					label={t("kpi_attendance_7d")}
					value={
						d.presence7j === null ? (
							"—"
						) : (
							<AnimatedNumber value={d.presence7j} suffix=" %" />
						)
					}
					icon={<ClipboardCheck size={22} />}
					tone={
						d.presence7j !== null && d.presence7j < 70 ? "danger" : "positive"
					}
				/>
			</div>

			{/* Alertes — absences répétées (élève à risque). Masqué si rien. */}
			{d.alertes.absences.count > 0 && (
				<Card pad={false} className="border-amber-200 bg-amber-50/40">
					<div className="flex items-center gap-2 border-b border-amber-200/60 px-5 py-4">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
							<TriangleAlert size={16} />
						</span>
						<h3 className="text-sm font-bold text-ink-900">
							{t("repeated_absences")}
						</h3>
						<span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
							{d.alertes.absences.count} {t("students_count_suffix")}
						</span>
						<span className="ml-auto text-[11px] font-semibold text-ink-400">
							{t("over_30_days")}
						</span>
					</div>
					<ul className="divide-y divide-amber-200/40">
						{d.alertes.absences.top.map((a) => (
							<li
								key={a.studentId}
								className="flex items-center gap-3 px-5 py-3"
							>
								<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
									{a.firstName[0]}
									{a.lastName[0]}
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-bold text-ink-900">
										{a.firstName} {a.lastName}
									</p>
									<p className="text-xs font-semibold text-amber-700">
										{a.count} {t("unjustified_absences_suffix")}
									</p>
								</div>
								<Link
									href={`/dashboard/students/${a.studentId}`}
									className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-surface-white px-2.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
								>
									{t("view_profile")}
									<ArrowRight size={13} className="rtl:rotate-180" />
								</Link>
							</li>
						))}
					</ul>
				</Card>
			)}

			{/* Pointage à compléter — UNIQUEMENT les séances que le gérant assure
			    lui-même (il peut aussi enseigner). Masqué s'il n'enseigne pas. */}
			{d.alertes.sansPointage.count > 0 && (
				<Card pad={false} className="border-brand-200 bg-brand-50/30">
					<div className="flex items-center gap-2 border-b border-brand-200/60 px-5 py-4">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
							<ClipboardList size={16} />
						</span>
						<h3 className="text-sm font-bold text-ink-900">
							{t("attendance_to_complete")}
						</h3>
						<span className="rounded-full bg-brand-200 px-2 py-0.5 text-[11px] font-bold text-brand-800">
							{d.alertes.sansPointage.count} {t("sessions_count_suffix")}
						</span>
						<Link
							href="/dashboard/attendance"
							className="ml-auto text-xs font-bold text-brand-600 hover:text-brand-700"
						>
							{t("quick_take_attendance")} →
						</Link>
					</div>
					<ul className="divide-y divide-brand-200/40">
						{d.alertes.sansPointage.top.map((s) => (
							<li key={s.id} className="flex items-center gap-3 px-5 py-3">
								<span className="text-xs font-bold tabular-nums text-brand-600">
									{new Date(s.start).toLocaleDateString(dateLocale, {
										day: "2-digit",
										month: "2-digit",
									})}
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-ink-900">
										{localizedSubject(s.activity, dateLocale)} ·{" "}
										{localizedGroup(s.group, dateLocale)}
									</p>
									<p className="text-[11px] text-ink-400">
										{t("no_attendance_recorded")}
									</p>
								</div>
							</li>
						))}
					</ul>
				</Card>
			)}

			<div
				style={{ animationDelay: "280ms", animationFillMode: "backwards" }}
				className="grid grid-cols-1 gap-6 duration-500 animate-in fade-in slide-in-from-bottom-2 lg:grid-cols-3"
			>
				{/* Recouvrement — impayés à relancer (1 clic WhatsApp) */}
				<Card className="lg:col-span-2" pad={false}>
					<div className="flex items-center justify-between border-b border-line/60 px-5 py-4">
						<div className="flex items-center gap-2">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
								<AlertCircle size={16} />
							</span>
							<h3 className="text-sm font-bold text-ink-900">
								{t("to_follow_up")}
							</h3>
						</div>
						<Link
							href="/dashboard/payments"
							className="text-xs font-bold text-brand-600 hover:text-brand-700"
						>
							{t("view_all")} →
						</Link>
					</div>
					{d.recouvrement.top.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-12 text-center">
							<CheckCircle2 size={28} className="text-emerald-500" />
							<p className="text-sm font-semibold text-ink-700">
								{t("no_overdue")} 🎉
							</p>
						</div>
					) : (
						<ul className="divide-y divide-line/50">
							{d.recouvrement.top.map((o) => {
								const phone = normalizeDzPhone(o.phone);
								const waUrl = phone
									? buildWaUrl(
											phone,
											buildRelanceMessage({
												firstName: o.firstName,
												remaining: o.remaining,
												school,
											}),
										)
									: null;
								return (
									<li
										key={o.paymentPlanId}
										className="flex items-center gap-3 px-5 py-3"
									>
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
											{o.firstName[0]}
											{o.lastName[0]}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-bold text-ink-900">
												{o.firstName} {o.lastName}
											</p>
											<p className="flex items-center gap-1.5 text-xs text-accent-600">
												<Clock size={11} />
												{t("late_days")} {o.daysLate} {t("days_short")} ·{" "}
												{formatCurrency(o.overdueAmount)}
											</p>
										</div>
										{waUrl && (
											<RelanceButton
												waUrl={waUrl}
												studentId={o.studentId}
												paymentPlanId={o.paymentPlanId}
												amount={o.remaining}
												daysLate={o.daysLate}
												className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
											/>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</Card>

				{/* Aujourd'hui */}
				<Card pad={false}>
					<div className="flex items-center gap-2 border-b border-line/60 px-5 py-4">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
							<CalendarClock size={16} />
						</span>
						<h3 className="text-sm font-bold text-ink-900">
							{t("today_label")}
						</h3>
					</div>
					<div className="grid grid-cols-2 gap-3 p-5">
						<div className="rounded-xl bg-surface-50 p-3 text-center">
							<div className="text-2xl font-extrabold text-ink-900">
								{d.today.count}
							</div>
							<div className="text-[11px] font-bold uppercase tracking-widest text-ink-400">
								{t("sessions_label")}
							</div>
						</div>
						<div className="rounded-xl bg-surface-50 p-3 text-center">
							<div className="text-2xl font-extrabold text-ink-900">
								{d.today.presentRatio === null
									? "—"
									: `${d.today.presentRatio}%`}
							</div>
							<div className="text-[11px] font-bold uppercase tracking-widest text-ink-400">
								{t("presence_label")}
							</div>
						</div>
					</div>
					{d.today.sessions.length > 0 ? (
						<ul className="divide-y divide-line/50 px-2 pb-2">
							{d.today.sessions.slice(0, 4).map((s) => (
								<li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
									<span className="text-xs font-bold tabular-nums text-brand-600">
										{new Date(s.start).toLocaleTimeString(dateLocale, {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-ink-900">
											{localizedSubject(s.activity, dateLocale)} ·{" "}
											{localizedGroup(s.group, dateLocale)}
										</p>
										<p className="truncate text-[11px] text-ink-400">
											{s.room ?? t("no_room")}
											{s.instructor ? ` · ${s.instructor}` : ""}
										</p>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="flex items-center gap-2 px-5 pb-6 pt-2 text-xs text-ink-400">
							<Users size={14} />
							{t("no_session_today")}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
