import {
	ArrowRight,
	CalendarClock,
	CheckCircle2,
	Clock,
	UserPlus,
	Users,
	Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getSecretaryOverviewAction } from "@/actions/dashboard.actions";
import { Card, PageHeader, StatCard } from "@/components/ui/primitives";
import { Link } from "@/i18n/routing";
import { getCurrentTenant } from "@/services/api";
import { formatCurrency, formatDate } from "@/utils/format";

const QUICK_ACTIONS = [
	{
		href: "/dashboard/payments",
		labelKey: "quick_collect_payment",
		icon: Wallet,
		tone: "bg-brand-500 text-white",
	},
	{
		href: "/dashboard/students",
		labelKey: "quick_enroll_student",
		icon: UserPlus,
		tone: "bg-surface-white text-ink-900 border border-line",
	},
] as const;

export default async function SecretaryCockpit() {
	const t = await getTranslations();
	const dateLocale = (await getLocale()) === "ar" ? "ar-DZ" : "fr-FR";
	const [res, tenant] = await Promise.all([
		getSecretaryOverviewAction({}),
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
	const school = tenant?.name ?? t("default_school_name");
	const today = new Date().toLocaleDateString(dateLocale, {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("secretary_eyebrow")}
				title={t("secretary_title")}
				subtitle={`${today} — ${school} · ${t("secretary_subtitle_tail")}`}
			/>

			{/* Actions rapides — 1 clic */}
			<div className="grid grid-cols-2 gap-3">
				{QUICK_ACTIONS.map((a) => (
					<Link
						key={a.href}
						href={a.href}
						className={`group flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold shadow-ts-1 transition-all hover:-translate-y-0.5 hover:shadow-ts-2 ${a.tone}`}
					>
						<a.icon size={20} />
						<span className="flex-1">{t(a.labelKey)}</span>
						<ArrowRight
							size={16}
							className="opacity-50 transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
						/>
					</Link>
				))}
			</div>

			{/* KPIs — à encaisser aujourd'hui en focal */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="lg:col-span-2">
					<StatCard
						label={t("kpi_collect_today")}
						value={formatCurrency(d.counts.aEncaisserAmount)}
						icon={<Wallet size={22} />}
						tone={d.counts.aEncaisserAmount > 0 ? "danger" : "positive"}
						hint={
							d.counts.aEncaisserCount > 0
								? `${d.counts.aEncaisserCount} ${t("installments_count_suffix")}`
								: t("kpi_nothing_to_collect")
						}
					/>
				</div>
				<StatCard
					label={t("kpi_enrolled_month")}
					value={`${d.counts.monthRegistrations}`}
					icon={<UserPlus size={22} />}
					tone="positive"
				/>
				<StatCard
					label={t("kpi_sessions_today")}
					value={`${d.counts.todaySessions}`}
					icon={<CalendarClock size={22} />}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Échéances à encaisser */}
				<Card className="lg:col-span-2" pad={false}>
					<div className="flex items-center justify-between border-b border-line/60 px-5 py-4">
						<div className="flex items-center gap-2">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
								<Wallet size={16} />
							</span>
							<h3 className="text-sm font-bold text-ink-900">
								{t("installments_to_collect")}
							</h3>
						</div>
						<Link
							href="/dashboard/payments"
							className="text-xs font-bold text-brand-600 hover:text-brand-700"
						>
							{t("cashbox_link")} →
						</Link>
					</div>
					{d.aEncaisser.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-12 text-center">
							<CheckCircle2 size={28} className="text-emerald-500" />
							<p className="text-sm font-semibold text-ink-700">
								{t("nothing_to_collect_today")} 🎉
							</p>
						</div>
					) : (
						<ul className="divide-y divide-line/50">
							{d.aEncaisser.map((tr) => (
								<li
									key={tr.trancheId}
									className="flex items-center gap-3 px-5 py-3"
								>
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
										{tr.firstName[0]}
										{tr.lastName[0]}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-bold text-ink-900">
											{tr.firstName} {tr.lastName}
										</p>
										<p className="flex items-center gap-1.5 text-xs text-ink-400">
											<Clock size={11} />
											{t("due_label")} {formatDate(tr.dueDate)}
											{tr.overdue && (
												<span className="font-bold text-accent-600">
													{" "}
													· {t("overdue_label")}
												</span>
											)}
										</p>
									</div>
									<span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
										{formatCurrency(tr.amount)}
									</span>
									<Link
										href="/dashboard/payments"
										className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-500 px-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
									>
										{t("collect_button")}
									</Link>
								</li>
							))}
						</ul>
					)}
				</Card>

				{/* Dernières inscriptions */}
				<Card pad={false}>
					<div className="flex items-center gap-2 border-b border-line/60 px-5 py-4">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
							<Users size={16} />
						</span>
						<h3 className="text-sm font-bold text-ink-900">
							{t("recent_enrollments")}
						</h3>
					</div>
					{d.recentStudents.length === 0 ? (
						<div className="flex items-center gap-2 px-5 py-8 text-xs text-ink-400">
							<Users size={14} />
							{t("no_enrollment_yet")}
						</div>
					) : (
						<ul className="divide-y divide-line/50">
							{d.recentStudents.map((s) => (
								<li key={s.id} className="flex items-center gap-3 px-5 py-3">
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-50 text-xs font-bold text-ink-500">
										{s.firstName[0]}
										{s.lastName[0]}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-ink-900">
											{s.firstName} {s.lastName}
										</p>
										<p className="text-[11px] text-ink-400">
											{formatDate(s.registrationDate)}
										</p>
									</div>
									<Link
										href={`/dashboard/students/${s.id}`}
										className="text-ink-300 transition-colors hover:text-brand-600"
									>
										<ArrowRight size={15} className="rtl:rotate-180" />
									</Link>
								</li>
							))}
						</ul>
					)}
				</Card>
			</div>
		</div>
	);
}
