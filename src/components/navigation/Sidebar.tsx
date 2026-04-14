"use client";

import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MapPin, 
  BookOpen, 
  Wallet, 
  Settings, 
  LogOut,
  FileText,
  UserCheck,
  LucideIcon
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { clsx } from "clsx";
import { UserRole } from "@/types/schema";
import { useTranslations, useLocale } from 'next-intl';

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { labelKey: "dashboard", href: "/", icon: LayoutDashboard, roles: Object.values(UserRole) },
  { labelKey: "students", href: "/dashboard/students", icon: UserCheck, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "planning", href: "/dashboard/schedule", icon: Calendar, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE, UserRole.INTERVENANT] },
  { labelKey: "attendance", href: "/dashboard/attendance", icon: FileText, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE, UserRole.INTERVENANT] },
  { labelKey: "payments", href: "/dashboard/payments", icon: Wallet, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "groups", href: "/dashboard/groups", icon: Users, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "rooms", href: "/dashboard/rooms", icon: MapPin, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "activities", href: "/dashboard/activities", icon: BookOpen, roles: [UserRole.ADMIN, UserRole.GERANT] },
  { labelKey: "staff", href: "/dashboard/staff", icon: Users, roles: [UserRole.ADMIN, UserRole.GERANT] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const userRole = session?.user?.role;

  const filteredNavItems = navItems.filter(item => userRole && item.roles.includes(userRole));
  const showSettings = !!userRole;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-taysir-teal/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "fixed inset-y-0 start-0 z-50 flex w-72 h-screen flex-col bg-taysir-teal text-white shadow-2xl transition-transform duration-300 ease-in-out border-e border-white/5 md:relative md:translate-x-0 md:shadow-xl",
        isOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <img src="/logo.png" alt="Taysir" className="w-14 h-14 object-contain brightness-0 invert" />
          <span className="text-2xl font-black tracking-tight text-white">
            Taysir<span className="text-taysir-accent">.</span>
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-4 py-2 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ease-in-out relative",
                  isActive 
                    ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20 translate-x-1" 
                    : "text-white/50 hover:bg-white/5 hover:text-white hover:translate-x-1"
                )}
              >
                {isActive && (
                  <div className="absolute inset-y-3 w-1.5 bg-taysir-accent rounded-full -start-1 shadow-[0_0_10px_rgba(26,122,137,0.5)]" />
                )}
                <item.icon 
                  size={22} 
                  strokeWidth={1.5}
                  className={clsx(
                    "transition-all duration-300",
                    isActive ? "text-taysir-accent scale-110" : "group-hover:text-white group-hover:scale-110",
                    isRtl && (item.icon === LogOut || item.icon === FileText) && "rotate-180"
                  )} 
                />
                <span className={clsx(
                  "truncate uppercase tracking-wider text-[11px]",
                  isActive ? "font-bold" : ""
                )}>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/5 p-4 bg-black/20 space-y-2">
          {showSettings && (
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ease-in-out relative",
                pathname === "/dashboard/settings"
                  ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <Settings 
                size={22} 
                strokeWidth={1.5}
                className={clsx(
                  "transition-all duration-300",
                  pathname === "/dashboard/settings" ? "text-taysir-accent scale-110" : "group-hover:text-white group-hover:scale-110"
                )} 
              />
              <span className={clsx(
                "truncate uppercase tracking-wider text-[11px]",
                pathname === "/dashboard/settings" ? "font-bold" : ""
              )}>{t("settings")}</span>
            </Link>
          )}

          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-taysir-light to-taysir-teal flex items-center justify-center text-sm font-black text-white shadow-xl ring-2 ring-white/10">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-black text-white leading-tight">{session?.user?.name}</span>
              <span className="truncate text-[9px] font-bold text-taysir-light/60 uppercase tracking-[0.2em] mt-1">{userRole}</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              onClose?.();
              signOut({ callbackUrl: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-black text-white/40 hover:bg-red-500/15 hover:text-red-400 transition-all duration-300 ease-in-out group uppercase tracking-widest"
          >
            <LogOut size={22} strokeWidth={1.5} className={clsx("transition-transform group-hover:ms-1", isRtl && "rotate-180")} />
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
