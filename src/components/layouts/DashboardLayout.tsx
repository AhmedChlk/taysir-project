"use client";

import { clsx } from "clsx";
import { AnimatePresence } from "framer-motion";
import {
	ChevronDown,
	Loader2,
	LogOut,
	Menu,
	Settings,
	User,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { getDashboardFormDataAction } from "@/actions/dashboard.actions";
import NotificationBell from "@/components/dashboard/NotificationBell";
import LanguageSwitcher from "@/components/navigation/LanguageSwitcher";
import Sidebar from "@/components/navigation/Sidebar";
import Drawer, { type DrawerType } from "@/components/ui/Drawer";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { usePopoverDismiss } from "@/lib/hooks/usePopoverDismiss";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: session, status } = useSession();
	const t = useTranslations();
	const locale = useLocale();
	const isRtl = locale === "ar";
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const closeUserMenu = useCallback(() => setIsUserMenuOpen(false), []);
	usePopoverDismiss(isUserMenuOpen, closeUserMenu);

	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const activeDrawer = searchParams.get("drawer");

	/* Contextual page name for the topbar eyebrow (replaces static "BIENVENUE").
	   Route segment → i18n key; student detail etc. resolve to their section. */
	const PAGE_KEY: Record<string, string> = {
		dashboard: "dashboard",
		students: "students",
		schedule: "planning",
		attendance: "attendance",
		payments: "payments",
		groups: "groups",
		rooms: "rooms",
		staff: "staff",
		activities: "activities",
		settings: "settings",
	};
	const pageSegment = pathname
		.split("/")
		.reverse()
		.find((s) => s in PAGE_KEY);
	const pageKey = (pageSegment && PAGE_KEY[pageSegment]) || "dashboard";

	type DashboardFormData = Extract<
		Awaited<ReturnType<typeof getDashboardFormDataAction>>,
		{ success: true }
	>["data"];

	const [formData, setFormData] = useState<DashboardFormData | null>(null);
	const [isLoadingFormData, setIsLoadingFormData] = useState(false);

	useEffect(() => {
		if (activeDrawer && !formData && !isLoadingFormData) {
			setIsLoadingFormData(true);
			getDashboardFormDataAction({}).then((res) => {
				if (res?.success) setFormData(res.data);
				setIsLoadingFormData(false);
			});
		}
	}, [activeDrawer, formData, isLoadingFormData]);

	const closeDrawer = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("drawer");
		params.delete("id");
		params.delete("start");
		params.delete("end");
		params.delete("date");
		const queryString = params.toString();
		router.push(pathname + (queryString ? `?${queryString}` : ""), {
			scroll: false,
		});
	};

	if (status === "loading") {
		return (
			<div
				role="status"
				aria-live="polite"
				className="flex h-screen w-full items-center justify-center bg-surface-0"
			>
				<Loader2 className="h-10 w-10 animate-spin text-brand-500" />
				<span className="sr-only">{t("loading")}</span>
			</div>
		);
	}

	if (!session) return null;

	return (
		<div className="flex h-screen bg-surface-0 text-ink-900 font-body overflow-hidden">
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

			<main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
				<header className="h-20 bg-surface-white border-b border-line/60 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => setIsSidebarOpen(true)}
							aria-label={t("menu_open")}
							className="p-2 rounded-[16px] hover:bg-brand-500/5 text-brand-500 md:hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
						>
							<Menu size={24} />
						</button>

						<div className="hidden md:block">
							<h2 className="text-xs font-black text-ink-400 uppercase tracking-[0.2em]">
								{t(pageKey)}
							</h2>
						</div>

						<div className="md:hidden flex items-center gap-2">
							<div className="relative h-8 w-8">
								<Image
									src="/logo.png"
									alt="Logo"
									fill
									className="object-contain"
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								/>
							</div>
							<span className="text-lg font-black text-brand-500 tracking-tighter uppercase">
								TAYSIR
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3 md:gap-6">
						<div className="hidden sm:block">
							<LanguageSwitcher />
						</div>

						<NotificationBell />

						<div className="relative">
							<button
								type="button"
								onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
								aria-haspopup="menu"
								aria-expanded={isUserMenuOpen}
								aria-controls="user-menu-panel"
								className={clsx(
									"group flex items-center gap-3 p-1 rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
									isUserMenuOpen
										? "bg-brand-500/5 ring-1 ring-brand-500/10"
										: "hover:bg-brand-500/5",
								)}
							>
								<div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-black shadow-sm transition-transform group-hover:scale-105">
									{session.user?.name?.charAt(0).toUpperCase() || "U"}
								</div>
								<div className="hidden lg:block text-start">
									<p className="text-sm font-black leading-none text-brand-600 transition-colors">
										{session.user?.name}
									</p>
									<p className="text-[10px] font-black text-ink-500 uppercase mt-1 tracking-wider">
										{session.user?.role}
									</p>
								</div>
								<ChevronDown
									size={14}
									className={clsx(
										"text-ink-400 transition-transform duration-200",
										isUserMenuOpen && "rotate-180",
									)}
								/>
							</button>

							{isUserMenuOpen && (
								<>
									<button
										type="button"
										tabIndex={-1}
										aria-hidden
										className="fixed inset-0 z-40 cursor-default bg-transparent w-full h-full"
										onClick={() => setIsUserMenuOpen(false)}
									/>
									<div
										id="user-menu-panel"
										role="menu"
										className={clsx(
											"ts-pop absolute top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-brand-500/5 py-2 z-50",
											isRtl ? "left-0" : "right-0",
										)}
									>
										<Link
											href="/dashboard/settings"
											role="menuitem"
											className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-brand-600 hover:bg-brand-500/5 transition-colors focus-visible:bg-brand-500/5 focus-visible:outline-none"
											onClick={() => setIsUserMenuOpen(false)}
										>
											<User size={18} className="text-brand-500/50" />
											{t("tab_account")}
										</Link>
										<Link
											href="/dashboard/settings"
											role="menuitem"
											className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-brand-600 hover:bg-brand-500/5 transition-colors focus-visible:bg-brand-500/5 focus-visible:outline-none"
											onClick={() => setIsUserMenuOpen(false)}
										>
											<Settings size={18} className="text-brand-500/50" />
											{t("settings")}
										</Link>
										<div className="sm:hidden px-5 py-3 border-t border-brand-500/5 mt-2">
											<LanguageSwitcher />
										</div>
										<div className="h-px bg-brand-500/5 my-2 mx-3" />
										<button
											type="button"
											role="menuitem"
											onClick={async () => {
												await signOut({ redirect: false });
												window.location.href = `/${locale}/login`;
											}}
											className="flex w-full items-center gap-3 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors focus-visible:bg-red-50 focus-visible:outline-none"
										>
											<LogOut size={18} />
											{t("logout")}
										</button>
									</div>
								</>
							)}
						</div>
					</div>
				</header>

				<div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
					<div className="mx-auto max-w-7xl px-4 md:px-8 py-8">{children}</div>
				</div>
			</main>

			<AnimatePresence mode="wait">
				{activeDrawer && (
					<Suspense fallback={null}>
						<Drawer
							key={activeDrawer + (searchParams.get("id") || "")}
							type={activeDrawer as DrawerType}
							onClose={closeDrawer}
							{...(formData ? { formData } : {})}
						/>
					</Suspense>
				)}
			</AnimatePresence>
		</div>
	);
}
