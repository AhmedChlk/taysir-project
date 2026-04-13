'use client';

import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { GraduationCap, Bell } from 'lucide-react';
import { WidgetSkeleton } from '@/components/ui/Skeleton';
import Drawer from '@/components/ui/Drawer';

interface DashboardSPAProps {
  stats: React.ReactNode;
  sessions: React.ReactNode;
  payments: React.ReactNode;
  locale: string;
}

const springTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 1
} as const;

export default function DashboardSPA({ stats, sessions, payments, locale }: DashboardSPAProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeDrawer = searchParams.get('drawer');
  
  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('drawer');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-taysir-bg p-4 md:p-8 font-sans selection:bg-taysir-teal/20">
      {/* Header Scolaire Dynamique */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition}
        >
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="text-taysir-teal" size={24} />
            <span className="text-xs font-bold tracking-[0.2em] text-taysir-teal/60 uppercase">Espace Direction</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-taysir-teal uppercase">
            TAYSIR<span className="text-taysir-accent">.</span>ERP
          </h1>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium opacity-60 uppercase tracking-wider">Aujourd&apos;hui</span>
            <span className="text-sm font-bold text-taysir-teal">
              {today.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-taysir-teal shadow-sm border border-taysir-teal/5 cursor-pointer hover:bg-taysir-teal hover:text-white transition-colors"
          >
            <Bell size={20} />
          </motion.div>
        </div>
      </header>

      {/* Bento Grid avec Suspense */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-5 max-w-7xl mx-auto">
        <Suspense fallback={<WidgetSkeleton />}>
          {stats}
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          {sessions}
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          {payments}
        </Suspense>

        {/* Action Rapide / Statut */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springTransition, delay: 0.2 }}
          className="col-span-1 md:col-span-8 bento-card p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-taysir-teal/5"
        >
          <div className="flex-1">
            <h3 className="text-2xl font-black text-taysir-teal uppercase tracking-tighter mb-2">
              Système Opérationnel
            </h3>
            <p className="text-sm text-taysir-teal/60 font-medium leading-relaxed max-w-md">
              L&apos;isolation multi-tenant est active. Toutes les données sont chiffrées et conformes aux protocoles de sécurité Taysir.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-3xl border border-taysir-teal/5 shadow-sm text-center">
              <div className="text-[10px] font-black text-taysir-teal/40 uppercase tracking-widest mb-1">Status</div>
              <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" /> Live
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Systèmes de Tiroirs (SPA Drawers) */}
      <AnimatePresence>
        {activeDrawer && (
          <Drawer 
            type={activeDrawer} 
            onClose={closeDrawer} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
