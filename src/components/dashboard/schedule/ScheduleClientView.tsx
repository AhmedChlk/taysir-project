"use client";

import { useState, useMemo } from "react";
import TaysirCalendar from "@/components/calendar/TaysirCalendar";
import Modal from "@/components/ui/Modal";
import { Select, Input } from "@/components/ui/FormInput";
import { Session, Room, User as UserType, Activity, Group, UserRole } from "@/types/schema";
import { Filter, Users, MapPin, Plus } from "lucide-react";
import { Views, View } from "react-big-calendar";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";

interface ScheduleClientViewProps {
  sessions: Session[];
  rooms: Room[];
  staff: UserType[];
  activities: Activity[];
  groups: Group[];
}

export default function ScheduleClientView({
  sessions,
  rooms,
  staff,
  activities,
  groups
}: ScheduleClientViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const t = useTranslations();

  const instructors = useMemo(() => {
    return (staff || []).filter(u => u.role === UserRole.INTERVENANT || u.role === UserRole.GERANT);
  }, [staff]);

  const activitiesMap = useMemo(() => {
    return (activities || []).reduce((acc, a) => {
      acc[a.id] = a;
      return acc;
    }, {} as Record<string, Activity>);
  }, [activities]);

  const roomsMap = useMemo(() => {
    return (rooms || []).reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {} as Record<string, Room>);
  }, [rooms]);

  const staffMap = useMemo(() => {
    return (staff || []).reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, UserType>);
  }, [staff]);

  const filteredEvents = useMemo(() => {
    return (sessions || [])
      .filter(session => {
        const roomMatch = selectedRoom === "all" || session.roomId === selectedRoom;
        const instructorMatch = selectedInstructor === "all" || session.instructorId === selectedInstructor;
        return roomMatch && instructorMatch;
      })
      .map(session => {
        const activity = activitiesMap[session.activityId];
        const room = roomsMap[session.roomId];
        const instructor = staffMap[session.instructorId];

        return {
          id: session.id,
          title: `${activity?.name || t("unknown")} - ${room?.name || t("unknown")}`,
          start: new Date(session.startTime),
          end: new Date(session.endTime),
          resource: {
            color: activity?.color,
            instructorName: formatFullName(instructor?.firstName, instructor?.lastName),
          }
        };
      });
  }, [selectedRoom, selectedInstructor, sessions, activitiesMap, roomsMap, staffMap, t]);

  return (
    <div className="flex flex-col space-y-6 h-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("planning")}</h1>
          <p className="text-sm text-gray-500">{t("rooms_subtitle")}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-teal/90 transition-colors"
        >
          <Plus size={20} />
          {t("add")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3 shrink-0">
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <MapPin size={14} className="text-primary-teal" />
            {t("rooms")}
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs focus:border-primary-teal focus:ring-primary-teal"
          >
            <option value="all">{t("rooms")}</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <Users size={14} className="text-primary-teal" />
            {t("teacher")}
          </label>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs focus:border-primary-teal focus:ring-primary-teal"
          >
            <option value="all">{t("teacher")}</option>
            {instructors.map(inst => (
              <option key={inst.id} value={inst.id}>{formatFullName(inst.firstName, inst.lastName)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Filter size={12} />
            {t("search")}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full overflow-hidden">
        <TaysirCalendar 
          events={filteredEvents} 
          view={calendarView}
          onView={(view) => setCalendarView(view)}
          onSelectEvent={(event) => alert(`${t("planning")}: ${event.title}`)}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("add")}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">{t("cancel")}</button>
            <button onClick={() => setIsModalOpen(false)} className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors">{t("save")}</button>
          </>
        }
      >
        <div className="space-y-4">
          <Select 
            label={t("activities")} 
            options={activities.map(a => ({ label: a.name, value: a.id }))} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label={t("rooms")} 
              options={rooms.map(r => ({ label: r.name, value: r.id }))} 
            />
            <Select 
              label={t("groups")} 
              options={groups.map(g => ({ label: g.name, value: g.id }))} 
            />
          </div>
          <Select 
            label={t("teacher")} 
            options={instructors.map(i => ({ label: formatFullName(i.firstName, i.lastName), value: i.id }))} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("days_mon")} type="date" />
            <Input label={t("today_agenda")} type="time" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
