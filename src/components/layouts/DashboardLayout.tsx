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
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-teal" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 md:hidden transition-all"
             >
                <Menu size={24} />
             </button>

             <div className="hidden md:block">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
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
                <span className="text-lg font-bold text-primary-teal tracking-tighter">TAYSIR</span>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <button className="relative p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-2.5 end-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={clsx(
                  "flex items-center gap-3 p-1.5 pe-3 rounded-full transition-all duration-200 cursor-pointer",
                  isUserMenuOpen ? "bg-gray-100 ring-2 ring-primary-teal/10" : "hover:bg-gray-100"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-accent-teal flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform group-hover:scale-105">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
                <div className="hidden lg:block text-start">
                  <p className="text-sm font-bold leading-none text-gray-900 group-hover:text-primary-teal transition-colors">{session.user?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-tight">{session.user?.role}</p>
                </div>
                <ChevronDown size={16} className={clsx("text-gray-400 transition-transform duration-200", isUserMenuOpen && "rotate-180")} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className={clsx(
                    "absolute top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
                    isRtl ? "left-0" : "right-0"
                  )}>
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={18} className="text-gray-400" />
                      {t("tab_account")}
                    </Link>
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={18} className="text-gray-400" />
                      {t("settings")}
                    </Link>
                    <div className="sm:hidden px-4 py-2 border-t border-gray-100 mt-2">
                       <LanguageSwitcher />
                    </div>
                    <div className="h-px bg-gray-100 my-2 mx-2" />
                    <button 
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-gray-50/50">
          <div className="mx-auto max-w-7xl p-4 md:p-8 lg:p-12 pb-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
