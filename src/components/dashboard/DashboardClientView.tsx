"use client";

import { Student, Activity, Room, Session } from "@/types/schema";
import { Users, BookOpen, MapPin, Calendar, ArrowUpRight, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { formatTime } from "@/utils/format";

interface DashboardClientViewProps {
  students: Student[];
  activities: Activity[];
  rooms: Room[];
  sessions: Session[];
  attendanceStats: number[];
}

export default function DashboardClientView({
  students,
  activities,
  rooms,
  sessions,
  attendanceStats
}: DashboardClientViewProps) {
  const t = useTranslations();
  
  const stats = [
    { label: t("total_students"), value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("activities"), value: activities.length, icon: BookOpen, color: "text-primary-teal", bg: "bg-primary-teal/10", trend: t("trend_active") },
    { label: t("rooms"), value: rooms.length, icon: MapPin, color: "text-orange-600", bg: "bg-orange-50", trend: t("trend_all_dispo") },
    { label: t("today_sessions"), value: sessions.length, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">{t("dashboard")}</h1>
        <p className="text-gray-500">{t("dashboard_welcome_subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={clsx("rounded-xl p-3", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              {"trend" in stat && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} />
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity / Chart Visual */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-teal" />
            {t("weekly_attendance")}
          </h3>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex h-64 items-end justify-between gap-2">
              {daysLabels.map((day, i) => {
                const val = attendanceStats[i] || 0; 
                return (
                  <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-t-lg bg-primary-teal transition-all hover:bg-accent-teal shadow-sm group-hover:shadow-md"
                      style={{ height: `${val}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {val}%
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's Agenda Widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">{t("today_agenda")}</h3>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
            {sessions.slice(0, 3).map((session, idx) => {
              const activity = activities.find(a => a.id === session.activityId);
              return (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex flex-col items-center justify-center min-w-[50px] py-1 bg-primary-teal/5 rounded-lg text-primary-teal">
                    <span className="text-xs font-bold uppercase">{formatTime(session.startTime)}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-gray-900 truncate">{activity?.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {rooms.find(r => r.id === session.roomId)?.name}
                    </p>
                  </div>
                </div>
              );
            })}
            <Link href="/dashboard/schedule">
              <button className="w-full py-2 text-sm font-medium text-primary-teal hover:bg-primary-teal/5 rounded-lg transition-colors border border-primary-teal/10">
                {t("view_all_schedule")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
