import { ArrowUpRight, Clock, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import { getPendingPaymentsAction } from "@/actions/dashboard.actions";

export default async function PaymentsWidget() {
	const response = await getPendingPaymentsAction({});

	if (!response.success) {
		return (
			<div className="rounded-[24px] p-8 text-danger bg-rose-50 border border-rose-100">
				Erreur chargement paiements.
			</div>
		);
	}

	const { totalAmount, count } = response.data;

	return (
		<div className="h-full bg-white border border-line rounded-[24px] p-8 shadow-sm flex flex-col justify-between group hover:shadow-ts-2 transition-all duration-300 overflow-hidden relative">
			<div className="relative z-10 flex flex-col h-full">
				<div className="flex items-center justify-between mb-8">
					<div className="p-3 bg-rose-50 rounded-xl text-danger border border-rose-100 group-hover:bg-danger group-hover:text-white transition-all duration-500 shadow-sm">
						<TrendingDown size={20} strokeWidth={2} />
					</div>
					<div className="bg-rose-50 text-danger px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-100">
						{count} dossiers
					</div>
				</div>

				<div className="mb-8 flex-1">
					<div className="text-4xl font-bold text-ink-900 tracking-tight transition-transform group-hover:scale-105 origin-left flex items-baseline gap-1.5 tabular-nums mb-2">
						{totalAmount.toLocaleString("fr-DZ")}
						<span className="text-lg text-ink-400 font-bold opacity-50">DA</span>
					</div>
					<span className="text-danger text-sm font-bold uppercase tracking-widest block">
						Reste à recouvrer
					</span>
				</div>

				<Link
					href="?drawer=payments"
					className="w-full py-4 bg-surface-50 border border-line text-ink-900 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-white hover:border-brand-500/20 hover:text-brand-500 shadow-sm"
				>
					<span>Détail impayés</span>
					<ArrowUpRight size={16} />
				</Link>
			</div>

			{/* Decorative Elements */}
			<div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-1000" />
		</div>
	);
}
