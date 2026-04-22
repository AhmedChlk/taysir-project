"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { Suspense } from "react";
import { WidgetSkeleton } from "@/components/ui/Skeleton";

interface DashboardSPAProps {
	stats: React.ReactNode;
	sessions: React.ReactNode;
	payments: React.ReactNode;
	kpis: React.ReactNode;
	roster: React.ReactNode;
	alerts: React.ReactNode;
	locale: string;
}

const springTransition = {
	type: "spring",
	stiffness: 200,
	damping: 20,
	mass: 1,
} as const;

const LogoMark = ({ size = 28, color = "var(--brand-500)" }: { size?: number; color?: string }) => (
	<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
		<g fill={color}>
			<rect x="26" y="6" width="12" height="52" rx="3" />
			<rect x="6" y="26" width="52" height="12" rx="3" />
			<rect x="26" y="26" width="12" height="12" fill="#fff" />
			<rect x="28" y="28" width="8" height="8" fill={color} />
		</g>
	</svg>
);

export default function DashboardSPA({
	stats,
	sessions,
	payments,
	kpis,
	roster,
	alerts,
	locale,
}: DashboardSPAProps) {
	const t = useTranslations();
	const today = new Date();

	return (
		<div className="min-h-screen bg-surface-50 p-4 md:p-10 font-sans antialiased">
			<header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
				<motion.div
					initial={{ x: -20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={springTransition}
					className="flex items-center gap-5"
				>
					<div className="w-16 h-16 bg-white rounded-2xl shadow-ts-2 border border-line flex items-center justify-center text-brand-500">
						<LayoutDashboard size={32} strokeWidth={1.75} />
					</div>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-[10px] font-bold tracking-[0.2em] text-ink-400 uppercase">
								{t("command_center")}
							</span>
							<div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
						</div>
						<h1 className="text-4xl font-bold tracking-tight text-ink-900">
							{t("dashboard")}
						</h1>
					</div>
				</motion.div>

				<div className="flex items-center gap-8">
					<div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white rounded-xl border border-line shadow-sm min-w-[320px] group focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
						<Search size={18} className="text-ink-400 group-focus-within:text-brand-500" />
						<input
							type="text"
							placeholder={t("search_placeholder")}
							className="bg-transparent border-none outline-none text-sm font-medium w-full text-ink-900 placeholder:text-ink-400"
						/>
					</div>

					<div className="flex flex-col items-end">
						<span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">
							{t("academic_calendar")}
						</span>
						<span className="text-sm font-bold text-ink-700">
							{today.toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR", {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}
						</span>
					</div>
				</div>
			</header>

			<main className="max-w-[1400px] mx-auto space-y-8 pb-32">
				<Suspense fallback={null}>
					<div className="animate-in fade-in slide-in-from-top duration-700">
						{alerts}
					</div>
				</Suspense>

				{/* Top Row: 3 Key Metrics (Students, Finance, Operations) */}
				<section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<Suspense fallback={<WidgetSkeleton className="col-span-1" />}>
						<div className="col-span-1 h-full">{stats}</div>
					</Suspense>

					<Suspense fallback={<WidgetSkeleton className="col-span-1" />}>
						<div className="col-span-1 h-full">{payments}</div>
					</Suspense>

					<Suspense fallback={<WidgetSkeleton className="col-span-1" />}>
						<div className="col-span-1 h-full">{sessions}</div>
					</Suspense>
				</section>

				{/* Middle Row: Deep Dive KPIs & Live Team */}
				<section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<Suspense fallback={<WidgetSkeleton className="col-span-1 lg:col-span-2" />}>
						<div className="col-span-1 lg:col-span-2 h-full">{kpis}</div>
					</Suspense>

					<Suspense fallback={<WidgetSkeleton className="col-span-1" />}>
						<div className="col-span-1 h-full">{roster}</div>
					</Suspense>
				</section>

				{/* Bottom Row: Support/Help Banner */}
				<section className="grid grid-cols-1 gap-8">
					<div className="col-span-1 rounded-[24px] p-10 bg-brand-900 text-white flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden shadow-ts-3 border border-white/5">
						<div className="relative z-10">
							<h3 className="text-3xl font-bold tracking-tight mb-4">
								{t("need_help")}
							</h3>
							<p className="text-lg font-medium text-white/60 max-w-md leading-relaxed">
								{t("support_desc")}
							</p>
							<div className="flex flex-wrap gap-4 mt-10">
								<button
									type="button"
									className="btn btn--secondary btn--md"
								>
									{t("user_guide")}
								</button>
								<button
									type="button"
									className="btn btn--primary btn--md"
								>
									{t("contact_support")}
								</button>
							</div>
						</div>
						
                        {/* Decorative LogoMark Background */}
                        <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12 pointer-events-none">
                            <LogoMark size={400} color="#fff" />
                        </div>
					</div>
				</section>
			</main>
		</div>
	);
}
