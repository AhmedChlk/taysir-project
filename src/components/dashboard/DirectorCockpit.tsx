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
	Phone,
	TrendingDown,
	TrendingUp,
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
import {
	Card,
	PageHeader,
	Sparkline,
	StatCard,
	TrendChart,
} from "@/components/ui/primitives";
import { Link } from "@/i18n/routing";
import { localizedGroup, localizedSubject } from "@/lib/subjects";
import {
	buildRelanceMessage,
	buildWaUrl,
	normalizeDzPhone,
} from "@/lib/wa-relance";
import { getCurrentTenant } from "@/services/api";
import { cn, formatCurrency } from "@/utils/format";

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

// Petit libellé de section (eyebrow) pour hiérarchiser le cockpit.
function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-ink-500">
			{children}
		</h3>
	);
}

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

	// Série trésorerie → libellés de mois localisés.
	const revenue = d.trends.revenue.map((r) => ({
		label: new Date(r.label).toLocaleDateString(dateLocale, { month: "short" }),
		value: r.value,
	}));
	const total6m = revenue.reduce((a, r) => a + r.value, 0);
	const delta = d.compare.revenueDeltaPct;

	// File de priorités « À traiter » — n'agrège que ce qui a un compteur > 0.
	const todos = [
		d.recouvrement.count > 0 && {
			key: "relance",
			icon: AlertCircle,
			chip: "bg-accent-50 text-accent-600",
			label: t("to_follow_up"),
			detail: `${d.recouvrement.count} ${t("students_late_suffix")} · ${formatCurrency(d.recouvrement.amount)}`,
			href: "/dashboard/payments",
		},
		d.alertes.sansPointage.count > 0 && {
			key: "unmarked",
			icon: ClipboardList,
			chip: "bg-brand-50 text-brand-600",
			label: t("attendance_to_complete"),
			detail: `${d.alertes.sansPointage.count} ${t("sessions_count_suffix")}`,
			href: "/dashboard/attendance",
		},
		d.alertes.absences.count > 0 && {
			key: "absences",
			icon: TriangleAlert,
			chip: "bg-amber-100 text-amber-700",
			label: t("repeated_absences"),
			detail: `${d.alertes.absences.count} ${t("students_count_suffix")}`,
			href: "/dashboard/attendance",
		},
	].filter(Boolean) as {
		key: string;
		icon: typeof AlertCircle;
		chip: string;
		label: string;
		detail: string;
		href: string;
	}[];

	return (
		<div className="space-y-10">
			<PageHeader
				eyebrow={t("director_eyebrow")}
				title={t("director_title")}
				accent={school}
				subtitle={`${today} — ${t("director_subtitle")}`}
			/>

			{/* Actions rapides — 1 clic chacune */}
			<div
				className={cn(
					"grid grid-cols-1 gap-3",
					quickActions.length === 4
						? "sm:grid-cols-2 lg:grid-cols-4"
						: "sm:grid-cols-3",
				)}
			>
				{quickActions.map((a) => (
					<Link
						key={a.href}
						href={a.href}
						className={cn(
							"group flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold shadow-ts-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ts-2 focus-visible:-translate-y-0.5 focus-visible:shadow-ts-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 active:translate-y-0 active:scale-[0.98]",
							a.tone,
						)}
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

			{/* ============================= FINANCES ============================= */}
			<section>
				<SectionLabel>{t("section_finances")}</SectionLabel>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<div className="lg:col-span-2">
						<StatCard
							href="/dashboard/payments"
							label={t("kpi_remaining_to_collect")}
							value={
								<AnimatedNumber
									value={d.finance.resteARecouvrer}
									suffix=" DA"
								/>
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
						href="/dashboard/payments"
						label={t("kpi_collected_month")}
						value={
							<AnimatedNumber value={d.finance.encaisseCeMois} suffix=" DA" />
						}
						icon={<CheckCircle2 size={22} />}
						tone="positive"
						hint={
							delta === null ? undefined : (
								<span
									className={cn(
										"inline-flex items-center gap-1 font-bold",
										delta >= 0 ? "text-emerald-600" : "text-accent-600",
									)}
								>
									{delta >= 0 ? (
										<TrendingUp size={12} />
									) : (
										<TrendingDown size={12} />
									)}
									{delta >= 0 ? "+" : ""}
									{delta}% · {t("vs_last_month")}
								</span>
							)
						}
					/>
					<StatCard
						href="/dashboard/payments"
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

				{/* Courbe de trésorerie 6 mois */}
				<Card pad={false} className="mt-4">
					<div className="flex items-end justify-between gap-4 border-b border-line/60 px-5 py-4">
						<div className="flex items-center gap-2">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
								<TrendingUp size={16} />
							</span>
							<h3 className="text-sm font-bold text-ink-900">
								{t("cashflow_title")}
							</h3>
						</div>
						<div className="text-end">
							<div className="text-lg font-extrabold tracking-tight text-ink-900">
								{formatCurrency(total6m)}
							</div>
							<div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
								{t("cashflow_total")}
							</div>
						</div>
					</div>
					<div className="px-5 py-5">
						<TrendChart
							points={revenue}
							formatValue={formatCurrency}
							ariaLabel={`${t("cashflow_title")} — ${formatCurrency(total6m)}`}
						/>
					</div>
				</Card>
			</section>

			{/* ============================== L'ÉCOLE ============================= */}
			<section>
				<SectionLabel>{t("section_school")}</SectionLabel>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<StatCard
						href="/dashboard/students"
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
						href="/dashboard/staff"
						label={t("staff")}
						value={<AnimatedNumber value={d.staffCount} />}
						icon={<UserCog size={22} />}
					/>
					<StatCard
						href="/dashboard/attendance"
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
						hint={
							<Sparkline
								data={d.trends.attendance}
								height={26}
								tone={
									d.presence7j !== null && d.presence7j < 70
										? "text-accent-500"
										: "text-emerald-500"
								}
							/>
						}
					/>
				</div>
			</section>

			{/* ============================= À TRAITER ============================ */}
			{todos.length > 0 && (
				<section>
					<SectionLabel>{t("section_todo")}</SectionLabel>
					<Card pad={false}>
						<ul className="divide-y divide-line/50">
							{todos.map((it) => (
								<li key={it.key}>
									<Link
										href={it.href}
										className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-50 focus-visible:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40"
									>
										<span
											className={cn(
												"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
												it.chip,
											)}
										>
											<it.icon size={18} />
										</span>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-bold text-ink-900">
												{it.label}
											</p>
											<p className="truncate text-xs font-semibold text-ink-500">
												{it.detail}
											</p>
										</div>
										<ArrowRight
											size={16}
											className="shrink-0 text-ink-400 rtl:rotate-180"
										/>
									</Link>
								</li>
							))}
						</ul>
					</Card>
				</section>
			)}

			{/* =================== RELANCES + AUJOURD'HUI ========================= */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
							className="inline-flex items-center gap-1 rounded-md px-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
						>
							{t("view_all")}
							<ArrowRight size={13} className="rtl:rotate-180" />
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
										{waUrl ? (
											<RelanceButton
												waUrl={waUrl}
												studentId={o.studentId}
												paymentPlanId={o.paymentPlanId}
												amount={o.remaining}
												daysLate={o.daysLate}
												className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
											/>
										) : (
											<span
												title={t("phone_missing")}
												className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-50 px-2.5 text-xs font-bold text-ink-400"
											>
												<Phone size={12} />
												{t("phone_missing")}
											</span>
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
							<div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
								{t("sessions_label")}
							</div>
						</div>
						<div className="rounded-xl bg-surface-50 p-3 text-center">
							<div className="text-2xl font-extrabold text-ink-900">
								{d.today.presentRatio === null
									? "—"
									: `${d.today.presentRatio}%`}
							</div>
							<div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
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
										<p className="truncate text-[11px] text-ink-500">
											{s.room ?? t("no_room")}
											{s.instructor ? ` · ${s.instructor}` : ""}
										</p>
									</div>
								</li>
							))}
							{d.today.count > 4 && (
								<li>
									<Link
										href="/dashboard/schedule"
										className="flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-bold text-brand-600 transition-colors hover:bg-surface-50 hover:text-brand-700 focus-visible:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40"
									>
										+{d.today.count - 4} · {t("view_all")}
										<ArrowRight size={12} className="rtl:rotate-180" />
									</Link>
								</li>
							)}
						</ul>
					) : (
						<div className="flex items-center gap-2 px-5 pb-6 pt-2 text-xs text-ink-500">
							<Users size={14} />
							{t("no_session_today")}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
