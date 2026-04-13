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
          className="fixed inset-0 z-40 bg-taysir-teal/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-taysir-teal text-white shadow-2xl transition-transform duration-300 ease-in-out border-e border-white/5 md:relative md:translate-x-0 md:shadow-xl",
        isOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
      )}>
        <div className="flex h-24 items-center justify-between px-6 py-4">
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
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase leading-none">TAYSIR</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mt-1">Scolaire</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 md:hidden transition-colors"
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
                  "group flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 ease-in-out relative",
                  isActive 
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute inset-y-3.5 w-1 bg-taysir-light rounded-full start-0" />
                )}
                <item.icon 
                  size={18} 
                  className={clsx(
                    "transition-all duration-200",
                    isActive ? "text-taysir-light scale-110" : "group-hover:text-white group-hover:scale-110",
                    isRtl && (item.icon === LogOut || item.icon === FileText) && "rotate-180"
                  )} 
                />
                <span className="truncate uppercase tracking-wider text-[11px]">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4 bg-black/10">
          <div className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-3 bg-white/5 border border-white/5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-taysir-light flex items-center justify-center text-sm font-black text-white shadow-inner">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-black text-white leading-tight">{session?.user?.name}</span>
              <span className="truncate text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">{userRole}</span>
            </div>
          </div>
          <button
            onClick={() => {
              onClose?.();
              signOut({ callbackUrl: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-black text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ease-in-out group uppercase tracking-widest"
          >
            <LogOut size={16} className={clsx("transition-transform group-hover:ms-1", isRtl && "rotate-180")} />
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
