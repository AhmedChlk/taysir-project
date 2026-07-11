"use client";

import { clsx } from "clsx";
import {
	AlertCircle,
	Bell,
	ClipboardList,
	type LucideIcon,
	TriangleAlert,
	UserPlus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	getNotificationsAction,
	markNotificationsSeenAction,
	type NotificationItem,
	type NotificationType,
} from "@/actions/dashboard.actions";
import { Link } from "@/i18n/routing";
import { usePopoverDismiss } from "@/lib/hooks/usePopoverDismiss";
import { formatCurrency } from "@/utils/format";

/* ==========================================================================
   NotificationBell — centre de notifications dérivées. Le badge = nombre
   d'évènements postérieurs à la dernière ouverture. Ouvrir marque le tout comme
   lu. A11y : trigger annoncé haspopup/expanded, compteur intégré au nom
   accessible + région aria-live, Escape ferme et restaure le focus au trigger,
   panneau = dialog qui reçoit le focus à l'ouverture, backdrop non focusable.
   ========================================================================== */

const ICONS: Record<NotificationType, LucideIcon> = {
	overdue: AlertCircle,
	absences: TriangleAlert,
	unmarked: ClipboardList,
	enrollment: UserPlus,
};

const CHIP: Record<NotificationType, string> = {
	overdue: "bg-accent-50 text-accent-600",
	absences: "bg-amber-100 text-amber-700",
	unmarked: "bg-brand-50 text-brand-600",
	enrollment: "bg-emerald-50 text-emerald-600",
};

const HREF: Record<NotificationType, string> = {
	overdue: "/dashboard/payments",
	absences: "/dashboard/attendance",
	unmarked: "/dashboard/attendance",
	enrollment: "/dashboard/students",
};

const PANEL_ID = "notif-panel";

export default function NotificationBell() {
	const t = useTranslations();
	const locale = useLocale();
	const isRtl = locale === "ar";

	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<NotificationItem[]>([]);
	const [unread, setUnread] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const panelRef = useRef<HTMLDivElement | null>(null);

	const close = useCallback(() => setOpen(false), []);
	usePopoverDismiss(open, close);

	const load = useCallback(async () => {
		const res = await getNotificationsAction({});
		if (res.success) {
			setItems(res.data.items);
			setUnread(res.data.unreadCount);
		}
		setLoaded(true);
	}, []);

	useEffect(() => {
		load();
		// Revalide au retour sur l'onglet (nouvelles échéances / inscriptions).
		const onFocus = () => load();
		window.addEventListener("focus", onFocus);
		return () => window.removeEventListener("focus", onFocus);
	}, [load]);

	// Déplace le focus DANS le panneau à l'ouverture (SR annonce le dialog).
	useEffect(() => {
		if (open) panelRef.current?.focus();
	}, [open]);

	const handleOpen = async () => {
		const next = !open;
		setOpen(next);
		if (next && unread > 0) {
			setUnread(0); // optimiste
			const res = await markNotificationsSeenAction({});
			if (!res.success) load(); // rollback : recharge le vrai compte
		}
	};

	const relTime = (iso: string): string => {
		const diff = Date.now() - new Date(iso).getTime();
		const day = 86_400_000;
		const rtf = new Intl.RelativeTimeFormat(isRtl ? "ar" : "fr", {
			numeric: "auto",
		});
		if (diff < 3_600_000)
			return rtf.format(-Math.round(diff / 60_000), "minute");
		if (diff < day) return rtf.format(-Math.round(diff / 3_600_000), "hour");
		return rtf.format(-Math.round(diff / day), "day");
	};

	const bodyFor = (it: NotificationItem): string => {
		switch (it.type) {
			case "overdue":
				return `${it.count} ${t("students_late_suffix")} · ${formatCurrency(it.amount)}`;
			case "absences":
				return `${it.count} ${t("students_count_suffix")}`;
			case "unmarked":
				return `${it.count} ${t("sessions_count_suffix")}`;
			case "enrollment":
				return `${it.count} ${t("notif_new_suffix")}`;
		}
	};

	const accessibleName =
		loaded && unread > 0
			? `${t("notifications")} · ${unread} ${t("notif_unread_suffix")}`
			: t("notifications");

	return (
		<div className="relative">
			<button
				type="button"
				onClick={handleOpen}
				aria-label={accessibleName}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={PANEL_ID}
				className={clsx(
					"relative p-2.5 rounded-[16px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
					open
						? "bg-brand-500/10 text-brand-600"
						: "text-brand-600 hover:bg-brand-500/5",
				)}
			>
				<Bell size={20} />
				{loaded && unread > 0 && (
					<span
						aria-hidden
						className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-accent px-1 text-[9px] font-black text-white"
					>
						{unread > 9 ? "9+" : unread}
					</span>
				)}
			</button>
			{/* Annonce SR du compteur (change → lecteur d'écran informé). */}
			<span className="sr-only" aria-live="polite">
				{loaded && unread > 0 ? `${unread} ${t("notif_unread_suffix")}` : ""}
			</span>

			{open && (
				<>
					<button
						type="button"
						tabIndex={-1}
						aria-hidden
						className="fixed inset-0 z-40 cursor-default bg-transparent"
						onClick={() => setOpen(false)}
					/>
					<div
						id={PANEL_ID}
						ref={panelRef}
						role="dialog"
						aria-label={t("notifications")}
						tabIndex={-1}
						className={clsx(
							"ts-pop absolute top-full mt-3 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-500/5 bg-white py-2 shadow-2xl z-50 focus:outline-none",
							isRtl ? "left-0" : "right-0",
						)}
					>
						<div className="flex items-center justify-between px-4 py-2">
							<h3 className="text-sm font-black text-ink-900">
								{t("notifications")}
							</h3>
							{items.length > 0 && (
								<span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
									{items.length}
								</span>
							)}
						</div>
						<div className="h-px bg-brand-500/5 mx-3 mb-1" />

						{items.length === 0 ? (
							<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
								<span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500/50">
									<Bell size={20} />
								</span>
								<p className="text-sm font-semibold text-ink-500">
									{t("notif_empty")}
								</p>
							</div>
						) : (
							<ul className="max-h-[24rem] overflow-y-auto">
								{items.map((it) => {
									const Icon = ICONS[it.type];
									return (
										<li key={it.id}>
											<Link
												href={HREF[it.type]}
												onClick={() => setOpen(false)}
												className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-50 focus-visible:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40"
											>
												<span
													className={clsx(
														"mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
														CHIP[it.type],
													)}
												>
													<Icon size={17} />
												</span>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-bold text-ink-900">
														{t(`notif_${it.type}_title`)}
													</p>
													<p className="truncate text-xs font-semibold text-ink-500">
														{bodyFor(it)}
													</p>
													<p className="mt-0.5 text-[10px] font-semibold text-ink-500">
														{relTime(it.at)}
													</p>
												</div>
											</Link>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</>
			)}
		</div>
	);
}
