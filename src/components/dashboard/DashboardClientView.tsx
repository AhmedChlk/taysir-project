"use client";

import { Student, Activity, Room, Session, Payment } from "@/types/schema";
import { Users, BookOpen, MapPin, Calendar, ArrowUpRight, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { formatTime } from "@/utils/format";
import { useMemo } from "react";

interface DashboardClientViewProps {
  students: Student[];
  activities: Activity[];
  rooms: Room[];
  sessions: Session[];
  attendanceStats: number[];
  payments: Payment[];
}

export default function DashboardClientView({
  students,
  activities,
  rooms,
  sessions,
  attendanceStats,
  payments = []
}: DashboardClientViewProps) {
  const t = useTranslations();
  
  const financialStats = useMemo(() => {
    const totalExpected = payments.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalPaid = payments.reduce((acc, p) => acc + p.paidAmount, 0);
    return { totalExpected, totalPaid, remaining: totalExpected - totalPaid };
  }, [payments]);

  const stats = [
    { label: t("total_students"), value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Types d'Activités", value: activities.length, icon: BookOpen, color: "text-primary-teal", bg: "bg-primary-teal/10" },
    { label: "Salles", value: rooms.length, icon: MapPin, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Finance (Recettes)", value: `${financialStats.totalPaid} DA`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  ];

  const daysLabels = [
    t("days_mon"),
    t("days_tue"),
    t("days_wed"),
    t("days_thu"),
    t("days_fri"),
    t("days_sat"),
    t("days_sun"),
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t("dashboard")}</h1>
        <p className="text-gray-500 font-medium">{t("dashboard_welcome_subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary-teal/20 active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <div className={clsx("rounded-2xl p-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Attendance Visual Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={22} className="text-primary-teal" />
              Taux de Présence Hebdomadaire
            </h3>
          </div>
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex h-64 items-end justify-between gap-4">
              {daysLabels.map((day, i) => {
                const val = attendanceStats[i] || 0; 
                return (
                  <div key={i} className="group relative flex flex-1 flex-col items-center gap-3">
                    <div 
                      className="w-full max-w-[40px] rounded-2xl bg-gradient-to-t from-primary-teal to-accent-teal transition-all hover:brightness-110 shadow-sm group-hover:shadow-lg"
                      style={{ height: `${val}%`, minHeight: '8px' }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-1.5 text-[10px] font-black text-white opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-1">
                      {val}%
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Financial & Agenda Overview */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet size={20} className="text-orange-500" />
              Santé Financière
            </h3>
            <div className="rounded-[32px] bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-xl text-white">
               <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Encaissé (DA)</p>
                    <p className="text-3xl font-black">{financialStats.totalPaid.toLocaleString()} DA</p>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-teal transition-all duration-1000" 
                      style={{ width: `${(financialStats.totalPaid / (financialStats.totalExpected || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">Reste à percevoir</span>
                    <span className="text-orange-400">{financialStats.remaining.toLocaleString()} DA</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-purple-500" />
              Planning du jour
            </h3>
            <div className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm space-y-3">
              {sessions.length > 0 ? sessions.slice(0, 4).map((session, idx) => {
                const activity = activities.find(a => a.id === session.activityId);
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100">
                    <div className="flex flex-col items-center justify-center min-w-[55px] py-2 bg-gray-100 rounded-xl text-gray-900 font-black text-xs transition-colors group-hover:bg-primary-teal group-hover:text-white">
                      {formatTime(session.startTime)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-gray-900 truncate text-sm">{activity?.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-0.5 tracking-wider">
                        <MapPin size={10} /> {rooms.find(r => r.id === session.roomId)?.name}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400 font-medium italic">Aucune séance aujourd'hui</p>
                </div>
              )}
              <Link href="/dashboard/schedule" className="block mt-2">
                <button className="w-full py-3 text-xs font-black text-primary-teal hover:bg-primary-teal/5 rounded-2xl transition-all border-2 border-primary-teal/10 uppercase tracking-widest">
                  Voir tout le planning
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
