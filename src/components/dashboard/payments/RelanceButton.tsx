"use client";

import { MessageCircle } from "lucide-react";
import { useTransition } from "react";
import { logRelanceAction } from "@/actions/relance.actions";
import { useRouter } from "@/i18n/routing";

/* Shared relance button (payments table + dashboard). Opens a pre-filled
   WhatsApp message AND records the relance in the journal, then refreshes so
   the "dernière relance" indicator updates. */
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
	const [, startTransition] = useTransition();
	const router = useRouter();

	const handleClick = () => {
		startTransition(async () => {
			await logRelanceAction({ studentId, paymentPlanId, amount, daysLate });
			router.refresh();
		});
	};

	return (
		<a
			href={waUrl}
			target="_blank"
			rel="noreferrer"
			onClick={handleClick}
			title="Relancer le parent sur WhatsApp"
			className={
				className ??
				"inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
			}
		>
			<MessageCircle size={15} />
			Relancer
		</a>
	);
}
