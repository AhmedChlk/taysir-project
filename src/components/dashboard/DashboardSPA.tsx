"use client";

import { motion } from "framer-motion";
import { GraduationCap, LayoutDashboard, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function DashboardSPA({
	stats,
	sessions,
	payments,
	kpis,
	roster,
	alerts,
	locale,
}: DashboardSPAProps) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const _activeDrawer = searchParams.get("drawer");
	const t = useTranslations();

	const _closeDrawer = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("drawer");
		params.delete("id");
		router.push(`?${params.toString()}`, { scroll: false });
	};

	const today = new Date();

	return (
		<div className="min-h-screen bg-taysir-bg p-4 md:p-10 font-sans selection:bg-taysir-teal/20">
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
				<motion.div
					initial={{ x: -30, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={springTransition}
					className="flex items-center gap-4"
				>
					<div className="w-14 h-14 bg-white rounded-[20px] shadow-sm border border-taysir-teal/5 flex items-center justify-center text-taysir-teal">
						<LayoutDashboard size={28} strokeWidth={1.5} />
					</div>
					<div>
						<div className="flex items-center gap-2 mb-0.5">
							<span className="text-[10px] font-black tracking-[0.3em] text-taysir-teal/40 uppercase">
								{t("command_center")}
							</span>
							<div className="w-1 h-1 rounded-full bg-taysir-accent animate-pulse" />
						</div>
						<h1 className="text-3xl md:text-4xl font-black tracking-tight text-taysir-teal uppercase">
							{t("dashboard")}
							<span className="text-taysir-accent">.</span>
						</h1>
					</div>
				</motion.div>

				<div className="flex items-center gap-6">
					<div className="hidden md:flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-taysir-teal/5 shadow-sm min-w-[300px] group focus-within:ring-2 focus-within:ring-taysir-teal/10 transition-all">
						<Search size={18} className="text-taysir-teal/30" />
						<input
							type="text"
							placeholder={t("search_placeholder")}
							className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-taysir-teal/20"
						/>
					</div>

					<div className="flex flex-col items-end">
						<span className="text-[10px] font-black text-taysir-teal/30 uppercase tracking-[0.2em]">
							{t("academic_calendar")}
						</span>
						<span className="text-sm font-black text-taysir-teal mt-0.5 text-right">
							{today.toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR", {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}
						</span>
					</div>
				</div>
			</header>

			<main className="max-w-[1400px] mx-auto space-y-10 pb-32">
				<Suspense fallback={null}>
					<div className="animate-in fade-in slide-in-from-top duration-700">
						{alerts}
					</div>
				</Suspense>

				<section className="grid grid-cols-1 md:grid-cols-12 gap-6">
					<Suspense fallback={<WidgetSkeleton className="col-span-8" />}>
						{stats}
					</Suspense>

					<Suspense fallback={<WidgetSkeleton className="col-span-4" />}>
						{kpis}
					</Suspense>
				</section>

				<section className="grid grid-cols-1 md:grid-cols-12 gap-6">
					<Suspense fallback={<WidgetSkeleton className="col-span-4" />}>
						{sessions}
					</Suspense>

					<Suspense fallback={<WidgetSkeleton className="col-span-8" />}>
						{roster}
					</Suspense>
				</section>

				<section className="grid grid-cols-1 md:grid-cols-12 gap-6">
					<Suspense fallback={<WidgetSkeleton className="col-span-4" />}>
						{payments}
					</Suspense>

					<div className="col-span-1 md:col-span-8 bento-card p-8 bg-gradient-to-br from-taysir-teal to-taysir-teal/90 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-2xl">
						<div className="relative z-10">
							<h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">
								{t("need_help")}
							</h3>
							<p className="text-sm font-medium text-white/70 max-w-md leading-relaxed">
								{t("support_desc")}
							</p>
							<div className="flex gap-4 mt-8">
								<button
									type="button"
									className="bg-white text-taysir-teal px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
								>
									{t("user_guide")}
								</button>
								<button
									type="button"
									className="bg-taysir-accent text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all"
								>
									{t("contact_support")}
								</button>
							</div>
						</div>
						<div className="relative z-10 w-24 h-24 bg-white/10 rounded-[32px] backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
							<GraduationCap
								size={48}
								className="text-taysir-accent"
								strokeWidth={1}
							/>
						</div>

						{/* Décoration asymétrique */}
						<div className="absolute -left-10 -bottom-10 w-40 h-40 bg-taysir-accent/20 rounded-full blur-3xl" />
					</div>
				</section>
			</main>
		</div>
	);
}
