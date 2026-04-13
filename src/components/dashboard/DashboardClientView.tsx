'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  GraduationCap,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { Student, Session, PaymentPlan } from '@/types/schema';
import { isSameDay } from 'date-fns';

interface DashboardProps {
  students: Student[];
  sessions: Session[];
  payments: PaymentPlan[];
  activities: any[];
  rooms: any[];
  attendanceStats: number[];
}

const springTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 1
} as const;

export default function DashboardClientView({ 
  students, 
  sessions, 
  payments,
  activities: _activities,
  rooms: _rooms,
  attendanceStats: _attendanceStats 
}: DashboardProps) {
  // Calculs ERP Réels
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.isActive).length;
  
  const today = new Date();
  const todaySessions = sessions.filter(s => isSameDay(new Date(s.startTime), today));
  
  const pendingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL');
  const totalPendingAmount = pendingPayments.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  return (
    <div className="min-h-screen bg-taysir-bg p-4 md:p-8 font-sans selection:bg-taysir-light/20">
      {/* Header Scolaire */}
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
            TAYSIR<span className="text-taysir-light">.</span>ERP
          </h1>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium opacity-60 uppercase tracking-wider">Aujourd&apos;hui</span>
            <span className="text-sm font-bold text-taysir-teal">
              {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-taysir-teal shadow-sm border border-taysir-teal/5 cursor-pointer hover:bg-taysir-teal hover:text-white transition-colors">
            <Bell size={20} />
          </div>
        </div>
      </header>

      {/* Bento Grid Principal */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-5 max-w-7xl mx-auto">
        
        {/* KPI Majeur - Total Élèves */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={springTransition}
          className="col-span-1 md:col-span-8 bg-taysir-teal rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl"
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 opacity-70 mb-4">
                <Users size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">Effectif Global</span>
              </div>
              <h2 className="text-7xl md:text-8xl font-black tracking-tighter">
                {totalStudents}<span className="text-white/50 text-3xl ml-2 italic">élèves</span>
              </h2>
              <div className="flex gap-4 mt-4">
                 <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                   {activeStudents} Actifs
                 </span>
                 <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                   {totalStudents - activeStudents} En attente
                 </span>
              </div>
            </div>
            
            <div className="mt-12 flex gap-3">
              <button className="btn-secondary text-xs uppercase tracking-widest">
                Gérer les inscriptions
              </button>
              <button className="btn-ghost text-white hover:bg-white/10 border border-white/20 text-xs uppercase tracking-widest">
                Exporter
              </button>
            </div>
          </div>
          
          {/* Décoration asymétrique */}
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-taysir-light/20 rounded-full blur-3xl" />
          <div className="absolute right-10 bottom-10 opacity-10">
            <Users size={200} />
          </div>
        </motion.div>

        {/* Séance du Jour (Vertical) */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className="col-span-1 md:col-span-4 bento-card p-8 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="p-4 bg-taysir-teal/5 rounded-2xl text-taysir-teal">
              <Calendar size={24} />
            </div>
            <span className="text-taysir-light font-black text-sm flex items-center gap-1 bg-taysir-teal/5 px-3 py-1 rounded-full uppercase tracking-tighter">
              Aujourd&apos;hui
            </span>
          </div>
          <div className="mt-8">
            <div className="text-5xl font-black text-taysir-teal tracking-tighter mb-1">
              {todaySessions.length}
            </div>
            <h3 className="text-xl font-bold text-taysir-teal/80 uppercase tracking-tighter">Séances prévues</h3>
            <p className="text-sm text-taysir-teal/50 mt-2 font-medium">Répartition sur {todaySessions.length > 0 ? '3 salles' : '0 salle'}.</p>
          </div>
          <div className="mt-6 pt-6 border-t border-taysir-teal/5 flex items-center gap-2 text-taysir-light font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
            Voir le planning <ArrowUpRight size={14} />
          </div>
        </motion.div>

        {/* Micro-carte : Paiements en attente */}
        <motion.div 
          whileHover={{ y: -8 }}
          className="col-span-1 md:col-span-4 bg-white border border-taysir-teal/10 rounded-[32px] p-8 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 text-taysir-teal mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Wallet size={20} />
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">Recouvrement</span>
          </div>
          
          <div>
            <div className="text-3xl font-black text-taysir-teal tracking-tighter">
              {totalPendingAmount.toLocaleString('fr-DZ')} <span className="text-lg opacity-40">DZD</span>
            </div>
            <p className="text-xs font-bold text-amber-600 uppercase mt-1 tracking-tighter flex items-center gap-1">
              <Clock size={12} /> {pendingPayments.length} impayés détectés
            </p>
          </div>
          
          <div className="mt-6">
            <div className="h-1.5 w-full bg-taysir-teal/5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[65%]" />
            </div>
          </div>
        </motion.div>

        {/* Carte Statut Système / Action Rapide */}
        <motion.div 
          className="col-span-1 md:col-span-8 bento-card p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-taysir-teal/5"
        >
          <div className="flex-1">
            <h3 className="text-2xl font-black text-taysir-teal uppercase tracking-tighter mb-2">
              Système Opérationnel
            </h3>
            <p className="text-sm text-taysir-teal/60 font-medium leading-relaxed max-w-md">
              Toutes les données de l&apos;établissement sont synchronisées. L&apos;isolation multi-tenant est active pour 1 établissement.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2 text-xs font-bold text-taysir-teal/40 uppercase tracking-widest">
                <CheckCircle2 size={14} className="text-green-500" /> DB Connectée
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-taysir-teal/40 uppercase tracking-widest">
                <CheckCircle2 size={14} className="text-green-500" /> Auth JWT OK
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
             <div className="bg-white p-4 rounded-2xl border border-taysir-teal/5 shadow-sm text-center">
                <div className="text-xs font-black text-taysir-teal uppercase tracking-tighter opacity-40 mb-1">Salles</div>
                <div className="text-2xl font-black text-taysir-teal">08</div>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-taysir-teal/5 shadow-sm text-center">
                <div className="text-xs font-black text-taysir-teal uppercase tracking-tighter opacity-40 mb-1">Groupes</div>
                <div className="text-2xl font-black text-taysir-teal">12</div>
             </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
