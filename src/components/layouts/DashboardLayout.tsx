"use client";

import { useSession, signOut } from "next-auth/react";
import { Link } from "@/i18n/routing";
import Sidebar from "@/components/navigation/Sidebar";
import { useState } from "react";
import { Loader2, Bell, ChevronDown, User, LogOut, Settings, Menu } from "lucide-react";
import { useTranslations, useLocale } from 'next-intl';
import { clsx } from "clsx";
import LanguageSwitcher from "@/components/navigation/LanguageSwitcher";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-taysir-bg">
        <Loader2 className="h-10 w-10 animate-spin text-taysir-teal font-bold" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-taysir-bg text-taysir-teal font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-taysir-teal/5 flex items-center justify-between px-4 md:px-8 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-[16px] hover:bg-taysir-teal/5 text-taysir-teal md:hidden transition-all"
             >
                <Menu size={24} />
             </button>

             <div className="hidden md:block">
                <h2 className="text-xs font-black text-taysir-teal/30 uppercase tracking-[0.2em]">
                  {t("welcome")}
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
                <span className="text-lg font-black text-taysir-teal tracking-tighter uppercase">TAYSIR</span>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <button className="relative p-2.5 rounded-[16px] hover:bg-taysir-teal/5 text-taysir-teal/60 transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-2.5 end-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={clsx(
                  "flex items-center gap-3 p-1 rounded-full transition-all duration-200 cursor-pointer",
                  isUserMenuOpen ? "bg-taysir-teal/5 ring-1 ring-taysir-teal/10" : "hover:bg-taysir-teal/5"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-taysir-teal flex items-center justify-center text-white text-sm font-black shadow-sm transition-transform group-hover:scale-105">
                  {session.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden lg:block text-start">
                  <p className="text-sm font-black leading-none text-taysir-teal group-hover:text-taysir-teal transition-colors">{session.user?.name}</p>
                  <p className="text-[10px] font-black text-taysir-teal/40 uppercase mt-1 tracking-wider">{session.user?.role}</p>
                </div>
                <ChevronDown size={14} className={clsx("text-taysir-teal/40 transition-transform duration-200", isUserMenuOpen && "rotate-180")} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className={clsx(
                    "absolute top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-taysir-teal/5 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
                    isRtl ? "left-0" : "right-0"
                  )}>
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-taysir-teal/70 hover:bg-taysir-teal/5 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={18} className="text-taysir-teal/30" />
                      {t("tab_account")}
                    </Link>
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-taysir-teal/70 hover:bg-taysir-teal/5 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={18} className="text-taysir-teal/30" />
                      {t("settings")}
                    </Link>
                    <div className="sm:hidden px-5 py-3 border-t border-taysir-teal/5 mt-2">
                       <LanguageSwitcher />
                    </div>
                    <div className="h-px bg-taysir-teal/5 my-2 mx-3" />
                    <button 
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
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
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
