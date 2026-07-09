import {
	AlertTriangle,
	Building2,
	GraduationCap,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPlatformStatsAction } from "@/actions/superadmin.actions";

/**
 * Bandeau de KPIs plateforme (Réservé SUPER_ADMIN).
 * Agrège tous les établissements : parc, effectifs, finance.
 * Composant serveur — les données sont chargées côté serveur au rendu.
 */
export default async function PlatformStatsBar() {
	const res = await getPlatformStatsAction({});
	if (!res.success) return null;
	const { schools, people, finance } = res.data;
	const t = await getTranslations();

	const fmt = (n: number) => n.toLocaleString("fr-FR");

	const cards = [
		{
			icon: Building2,
			label: t("platform_establishments"),
			value: fmt(schools.total),
			hint: `${schools.active} ${t("platform_active_suffix")} · ${schools.inactive} ${t("platform_inactive_suffix")}`,
			tone: "text-brand-600",
		},
		{
			icon: GraduationCap,
			label: t("platform_students"),
			value: fmt(people.students),
			hint: `${fmt(people.activeStudents)} ${t("platform_active_suffix")}`,
			tone: "text-emerald-600",
		},
		{
			icon: Users,
			label: t("platform_staff"),
			value: fmt(people.staff),
			hint: t("platform_staff_desc"),
			tone: "text-indigo-600",
		},
		{
			icon: Wallet,
			label: t("platform_collected"),
			value: `${fmt(finance.revenueCollected)} ${finance.currency}`,
			hint: `${fmt(finance.outstanding)} ${finance.currency} ${t("platform_outstanding_hint")}`,
			tone: "text-amber-600",
		},
		{
			icon: TrendingUp,
			label: t("platform_new_month"),
			value: fmt(schools.newThisMonth),
			hint: t("platform_created_desc"),
			tone: "text-sky-600",
		},
		{
			icon: AlertTriangle,
			label: t("platform_contracts_renew"),
			value: fmt(schools.expiringSoon),
			hint: t("platform_contracts_desc"),
			tone: schools.expiringSoon > 0 ? "text-red-600" : "text-ink-400",
		},
	];

	return (
		<div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{cards.map((c) => (
				<div
					key={c.label}
					className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm"
				>
					<c.icon className={`mb-2 h-5 w-5 ${c.tone}`} />
					<div className="text-xl font-black tabular-nums text-ink-900">
						{c.value}
					</div>
					<div className="text-xs font-semibold text-ink-500">{c.label}</div>
					<div className="mt-1 text-[11px] text-ink-400">{c.hint}</div>
				</div>
			))}
		</div>
	);
}
