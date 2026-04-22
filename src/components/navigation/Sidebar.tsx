"use client";

import { clsx } from "clsx";
import {
	BookOpen,
	Calendar,
	FileText,
	LayoutDashboard,
	LogOut,
	ShieldCheck,
	type LucideIcon,
	MapPin,
	Settings,
	UserCheck,
	Users,
	Wallet,
    ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, getPathname } from "@/i18n/routing";
import { UserRole } from "@/types/schema";
import { motion } from "framer-motion";

interface NavItem {
	labelKey: string;
	href: string;
	icon: LucideIcon;
	roles: UserRole[];
}

const navItems: NavItem[] = [
	{
		labelKey: "dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		roles: [
			UserRole.ADMIN,
			UserRole.GERANT,
			UserRole.SECRETAIRE,
			UserRole.INTERVENANT,
			UserRole.PARTICIPANT,
			UserRole.RESPONSABLE,
		],
	},
	{
		labelKey: "students",
		href: "/dashboard/students",
		icon: UserCheck,
		roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE],
	},
	{
		labelKey: "planning",
		href: "/dashboard/schedule",
		icon: Calendar,
		roles: [
			UserRole.ADMIN,
			UserRole.GERANT,
			UserRole.SECRETAIRE,
			UserRole.INTERVENANT,
		],
	},
	{
		labelKey: "attendance",
		href: "/dashboard/attendance",
		icon: FileText,
		roles: [
			UserRole.ADMIN,
			UserRole.GERANT,
			UserRole.SECRETAIRE,
			UserRole.INTERVENANT,
		],
	},
	{
		labelKey: "payments",
		href: "/dashboard/payments",
		icon: Wallet,
		roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE],
	},
	{
		labelKey: "groups",
		href: "/dashboard/groups",
		icon: Users,
		roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE],
	},
	{
		labelKey: "rooms",
		href: "/dashboard/rooms",
		icon: MapPin,
		roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE],
	},
	{
		labelKey: "activities",
		href: "/dashboard/activities",
		icon: BookOpen,
		roles: [UserRole.ADMIN, UserRole.GERANT],
	},
	{
		labelKey: "staff",
		href: "/dashboard/staff",
		icon: Users,
		roles: [UserRole.ADMIN, UserRole.GERANT],
	},
];

const superAdminItems: NavItem[] = [
	{
		labelKey: "superadmin_tenants",
		href: "/superadmin/tenants",
		icon: ShieldCheck,
		roles: [UserRole.SUPER_ADMIN],
	},
];

interface SidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
}

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

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
	const { data: session } = useSession();
	const pathname = usePathname();
	const t = useTranslations();
	const locale = useLocale();
	const isRtl = locale === "ar";
	const userRole = session?.user?.role;

	const filteredNavItems = navItems.filter(
		(item) => userRole && item.roles.includes(userRole),
	);

	const filteredSuperAdminItems = superAdminItems.filter(
		(item) => userRole && item.roles.includes(userRole),
	);
	const showSettings = !!userRole;

	return (
		<>
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
					aria-hidden="true"
					onClick={onClose}
				/>
			)}

			<aside
				className={clsx(
					"fixed inset-y-0 start-0 z-50 flex w-72 h-screen flex-col bg-brand-900 text-white shadow-2xl transition-transform duration-300 ease-in-out border-e border-white/5 md:relative md:translate-x-0 md:shadow-none",
					isOpen
						? "translate-x-0"
						: isRtl
							? "translate-x-full"
							: "-translate-x-full",
				)}
			>
				{/* Sidebar Header */}
				<div className="flex items-center gap-3 px-8 h-20 shrink-0 border-b border-white/5">
					<LogoMark size={32} color="var(--brand-500)" />
					<span className="text-2xl font-bold tracking-tight text-white font-sans">
						taysir
					</span>
				</div>

				<div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar py-6 px-4">
					<nav className="space-y-8">
						{/* Super Admin Section */}
						{filteredSuperAdminItems.length > 0 && (
							<div className="space-y-1">
								<div className="px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
									Administration
								</div>
								{filteredSuperAdminItems.map((item) => {
									const isActive = pathname === item.href;
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={onClose}
											className={clsx(
												"group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 relative",
												isActive
													? "bg-brand-500 text-white shadow-lg shadow-brand-900/20"
													: "text-white/60 hover:bg-white/5 hover:text-white",
											)}
										>
											<item.icon
												size={20}
												strokeWidth={1.75}
												className={clsx(
													"shrink-0 transition-transform duration-200 group-hover:scale-110",
													isActive ? "text-white" : "text-white/40 group-hover:text-white",
												)}
											/>
											<span className="truncate">{t(item.labelKey)}</span>
											{isActive && (
												<motion.div 
                                                    layoutId="active-indicator"
                                                    className="absolute end-2 w-1.5 h-1.5 rounded-full bg-white" 
                                                />
											)}
										</Link>
									);
								})}
							</div>
						)}

						{/* Main Navigation Section */}
						{filteredNavItems.length > 0 && (
							<div className="space-y-1">
								<div className="px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
									Menu Principal
								</div>
								{filteredNavItems.map((item) => {
									const isActive = pathname === item.href;
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={onClose}
											className={clsx(
												"group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 relative",
												isActive
													? "bg-brand-500 text-white shadow-lg shadow-brand-900/20"
													: "text-white/60 hover:bg-white/5 hover:text-white",
											)}
										>
											<item.icon
												size={20}
												strokeWidth={1.75}
												className={clsx(
													"shrink-0 transition-transform duration-200 group-hover:scale-110",
													isActive ? "text-white" : "text-white/40 group-hover:text-white",
												)}
											/>
											<span className="truncate">{t(item.labelKey)}</span>
											{isActive && (
												<motion.div 
                                                    layoutId="active-indicator"
                                                    className="absolute end-2 w-1.5 h-1.5 rounded-full bg-white" 
                                                />
											)}
										</Link>
									);
								})}
							</div>
						)}
					</nav>
				</div>

				{/* Sidebar Footer */}
				<div className="mt-auto p-4 border-t border-white/5 space-y-4">
					{showSettings && (
						<Link
							href="/dashboard/settings"
							onClick={onClose}
							className={clsx(
								"group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
								pathname === "/dashboard/settings"
									? "bg-white/10 text-white"
									: "text-white/60 hover:bg-white/5 hover:text-white",
							)}
						>
							<Settings size={20} strokeWidth={1.75} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
							<span className="truncate">{t("settings")}</span>
						</Link>
					)}

					<div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
						<div className="h-10 w-10 shrink-0 rounded-xl bg-brand-500 flex items-center justify-center text-sm font-bold text-white shadow-inner">
							{session?.user?.name?.charAt(0).toUpperCase() || "U"}
						</div>
						<div className="flex flex-col min-w-0">
							<span className="truncate text-sm font-bold text-white leading-tight">
								{session?.user?.name}
							</span>
							<span className="truncate text-[10px] font-semibold text-white/40 uppercase tracking-wider mt-0.5">
								{userRole?.toLowerCase()}
							</span>
						</div>
                        <button 
                            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                            className="ms-auto p-2 text-white/30 hover:text-danger transition-colors"
                            title={t("logout")}
                        >
                            <LogOut size={18} />
                        </button>
					</div>
				</div>
			</aside>
		</>
	);
}
