"use client";

import Image from "next/image";
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
  X,
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
  { labelKey: "staff", href: "/dashboard/staff", icon: Users, roles: [UserRole.ADMIN, UserRole.GERANT] },
  { labelKey: "planning", href: "/dashboard/schedule", icon: Calendar, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE, UserRole.INTERVENANT] },
  { labelKey: "groups", href: "/dashboard/groups", icon: Users, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "rooms", href: "/dashboard/rooms", icon: MapPin, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "activities", href: "/dashboard/activities", icon: BookOpen, roles: [UserRole.ADMIN, UserRole.GERANT] },
  { labelKey: "payments", href: "/dashboard/payments", icon: Wallet, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "attendance", href: "/dashboard/attendance", icon: FileText, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE, UserRole.INTERVENANT] },
  { labelKey: "students", href: "/dashboard/students", icon: UserCheck, roles: [UserRole.ADMIN, UserRole.GERANT, UserRole.SECRETAIRE] },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings, roles: Object.values(UserRole) },
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

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-primary-teal text-white shadow-2xl transition-transform duration-300 ease-in-out border-e border-white/10 md:relative md:translate-x-0 md:shadow-xl",
        isOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
      )}>
        <div className="flex h-20 items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image 
                src="/logo.png" 
                alt={t("brand_name")} 
                fill 
                className="object-contain brightness-0 invert"
                sizes="40px"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight">{t("brand_name")}</span>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 md:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out relative",
                  isActive 
                    ? "bg-white/15 text-white shadow-sm" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute inset-y-2 w-1 bg-accent-teal rounded-full start-0" />
                )}
                <item.icon 
                  size={20} 
                  className={clsx(
                    "transition-all duration-200",
                    isActive ? "text-accent-teal scale-110" : "group-hover:text-white group-hover:scale-110",
                    isRtl && (item.icon === LogOut || item.icon === FileText) && "rotate-180"
                  )} 
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4 bg-black/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-accent-teal/20 border border-accent-teal/30 flex items-center justify-center text-sm font-bold text-accent-teal ring-2 ring-white/5">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-white">{session?.user?.name}</span>
              <span className="truncate text-[10px] font-bold text-white/40 uppercase tracking-widest">{userRole?.toLowerCase()}</span>
            </div>
          </div>
          <button
            onClick={() => {
              onClose?.();
              signOut({ callbackUrl: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ease-in-out group"
          >
            <LogOut size={20} className={clsx("transition-transform group-hover:ms-1", isRtl && "rotate-180")} />
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
