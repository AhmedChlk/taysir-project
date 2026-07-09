import {
	ArrowRight,
	CalendarClock,
	CalendarDays,
	CheckCircle2,
	ClipboardCheck,
	ClipboardList,
	Clock,
	MapPin,
	Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getTeacherOverviewAction } from "@/actions/dashboard.actions";
import { Card, PageHeader, StatCard } from "@/components/ui/primitives";
import { Link } from "@/i18n/routing";
import { localizedGroup, localizedSubject } from "@/lib/subjects";

const WEEKDAY_FMT: Intl.DateTimeFormatOptions = {
	weekday: "short",
	day: "2-digit",
	month: "2-digit",
};

function hhmm(d: Date | string) {
	return new Date(d).toLocaleTimeString("fr-FR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default async function TeacherCockpit() {
	const t = await getTranslations();
	const dateLocale = (await getLocale()) === "ar" ? "ar-DZ" : "fr-FR";
	const res = await getTeacherOverviewAction({});
	if (!res.success) {
		return (
			<Card>
				<p className="text-sm text-ink-500">{t("dashboard_load_error")}</p>
			</Card>
		);
	}
	const d = res.data;
	const today = new Date().toLocaleDateString(dateLocale, {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("teacher_eyebrow")}
				title={t("teacher_title")}
				subtitle={`${today} — ${t("teacher_subtitle_tail")}`}
			/>

			{/* KPIs — ce qu'un prof veut voir : combien aujourd'hui, à pointer. */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					label={t("kpi_sessions_today")}
					value={`${d.counts.todayCount}`}
					icon={<CalendarClock size={22} />}
					tone="brand"
				/>
				<StatCard
					label={t("kpi_to_mark")}
					value={`${d.counts.toPoint}`}
					icon={<ClipboardList size={22} />}
					tone={d.counts.toPoint > 0 ? "danger" : "positive"}
					hint={
						d.counts.toPoint > 0
							? t("kpi_attendance_pending")
							: t("kpi_all_done")
					}
				/>
				<StatCard
					label={t("teacher_my_groups")}
					value={`${d.counts.groups}`}
					icon={<Users size={22} />}
				/>
				<StatCard
					label={t("kpi_sessions_week")}
					value={`${d.counts.weekCount}`}
					icon={<CalendarDays size={22} />}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Mon planning du jour — pointage 1 clic par séance */}
				<Card className="lg:col-span-2" pad={false}>
					<div className="flex items-center justify-between border-b border-line/60 px-5 py-4">
						<div className="flex items-center gap-2">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
								<CalendarClock size={16} />
							</span>
							<h3 className="text-sm font-bold text-ink-900">
								{t("my_sessions_today")}
							</h3>
						</div>
						<Link
							href="/dashboard/schedule"
							className="text-xs font-bold text-brand-600 hover:text-brand-700"
						>
							{t("my_planning_link")} →
						</Link>
					</div>
					{d.today.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-12 text-center">
							<CheckCircle2 size={28} className="text-emerald-500" />
							<p className="text-sm font-semibold text-ink-700">
								{t("no_session_today")}
							</p>
						</div>
					) : (
						<ul className="divide-y divide-line/50">
							{d.today.map((s) => (
								<li key={s.id} className="flex items-center gap-3 px-5 py-3">
									<span className="w-12 shrink-0 text-xs font-bold tabular-nums text-brand-600">
										{hhmm(s.start)}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-bold text-ink-900">
											{localizedSubject(s.activity, dateLocale)} ·{" "}
											{localizedGroup(s.group, dateLocale)}
										</p>
										<p className="flex items-center gap-2 text-[11px] text-ink-400">
											<span className="inline-flex items-center gap-1">
												<MapPin size={11} />
												{s.room ?? t("no_room")}
											</span>
											<span className="inline-flex items-center gap-1">
												<Users size={11} />
												{s.roster} {t("students_count_suffix")}
											</span>
										</p>
									</div>
									{s.attendanceTaken ? (
										<span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700">
											<CheckCircle2 size={13} />
											{t("attendance_done")}
										</span>
									) : (
										<Link
											href="/dashboard/attendance"
											className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-500 px-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
										>
											<ClipboardCheck size={13} />
											{t("attendance_mark")}
										</Link>
									)}
								</li>
							))}
						</ul>
					)}
				</Card>

				{/* Mes groupes — lecture seule */}
				<Card pad={false}>
					<div className="flex items-center gap-2 border-b border-line/60 px-5 py-4">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
							<Users size={16} />
						</span>
						<h3 className="text-sm font-bold text-ink-900">
							{t("teacher_my_groups")}
						</h3>
					</div>
					{d.myGroups.length === 0 ? (
						<div className="flex items-center gap-2 px-5 py-8 text-xs text-ink-400">
							<Users size={14} />
							{t("no_group_assigned_week")}
						</div>
					) : (
						<ul className="divide-y divide-line/50">
							{d.myGroups.map((g) => (
								<li
									key={g.id}
									className="flex items-center justify-between px-5 py-3"
								>
									<span className="truncate text-sm font-semibold text-ink-900">
										{localizedGroup(g.name, dateLocale)}
									</span>
									<span className="shrink-0 rounded-full bg-surface-50 px-2 py-0.5 text-[11px] font-bold text-ink-500">
										{g.roster} {t("students_count_suffix")}
									</span>
								</li>
							))}
						</ul>
					)}
				</Card>
			</div>

			{/* Cette semaine — aperçu chronologique */}
			{d.week.length > 0 && (
				<Card pad={false}>
					<div className="flex items-center gap-2 border-b border-line/60 px-5 py-4">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
							<CalendarDays size={16} />
						</span>
						<h3 className="text-sm font-bold text-ink-900">
							{t("teacher_my_week")}
						</h3>
					</div>
					<ul className="divide-y divide-line/50">
						{d.week.map((s) => (
							<li key={s.id} className="flex items-center gap-3 px-5 py-2.5">
								<span className="w-16 shrink-0 text-[11px] font-bold uppercase text-ink-400">
									{new Date(s.start).toLocaleDateString(
										dateLocale,
										WEEKDAY_FMT,
									)}
								</span>
								<span className="flex items-center gap-1 text-xs font-bold tabular-nums text-brand-600">
									<Clock size={11} />
									{hhmm(s.start)}
								</span>
								<span className="min-w-0 flex-1 truncate text-sm text-ink-900">
									{localizedSubject(s.activity, dateLocale)} ·{" "}
									{localizedGroup(s.group, dateLocale)}
								</span>
								{s.attendanceTaken && (
									<CheckCircle2
										size={15}
										className="shrink-0 text-emerald-500"
									/>
								)}
								<ArrowRight
									size={13}
									className="shrink-0 text-ink-300 rtl:rotate-180"
								/>
							</li>
						))}
					</ul>
				</Card>
			)}
		</div>
	);
}
