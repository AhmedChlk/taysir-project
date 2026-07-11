"use client";

import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { logRelanceAction } from "@/actions/relance.actions";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/utils/format";

/* Shared relance button (payments table + dashboard). Opens a pre-filled
   WhatsApp message AND records the relance in the journal, then refreshes so
   the "dernière relance" indicator updates.
   In-flight : spinner + pointer-events-none (empêche le double-clic → double
   relance). Échec du journal (logRelanceAction renvoie {success:false}, ne
   throw pas) : état d'erreur visible + reclic = retry (plus d'échec silencieux). */
export function RelanceButton({
	waUrl,
	studentId,
	paymentPlanId,
	amount,
	daysLate,
	className,
}: {
	waUrl: string;
	studentId: string;
	paymentPlanId?: string | undefined;
	amount: number;
	daysLate: number;
	className?: string;
}) {
	const [isPending, startTransition] = useTransition();
	const [failed, setFailed] = useState(false);
	const router = useRouter();
	const t = useTranslations();

	const handleClick = () => {
		if (isPending) return; // garde anti-double-clic
		setFailed(false);
		startTransition(async () => {
			const res = await logRelanceAction({
				studentId,
				paymentPlanId,
				amount,
				daysLate,
			});
			if (res?.success) {
				router.refresh();
			} else {
				setFailed(true);
			}
		});
	};

	const base =
		className ??
		"inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100";

	return (
		<a
			href={waUrl}
			target="_blank"
			rel="noreferrer"
			onClick={handleClick}
			aria-busy={isPending}
			title={failed ? t("relance_failed") : t("relance_wa_title")}
			className={cn(
				base,
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
				isPending && "pointer-events-none opacity-70",
				failed &&
					"!border-accent-200 !bg-accent-50 !text-accent-600 focus-visible:!ring-accent-500/40",
			)}
		>
			{isPending ? (
				<Loader2 size={15} className="animate-spin" />
			) : failed ? (
				<AlertCircle size={15} />
			) : (
				<MessageCircle size={15} />
			)}
			{failed ? t("relance_retry") : t("relance_label")}
		</a>
	);
}
