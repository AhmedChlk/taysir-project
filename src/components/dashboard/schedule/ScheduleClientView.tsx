"use client";

import { useState, useMemo, useTransition } from "react";
import TaysirCalendar from "@/components/calendar/TaysirCalendar";
import Modal from "@/components/ui/Modal";
import { Select, Input } from "@/components/ui/FormInput";
import { Toggle } from "@/components/ui/Toggle";
import { Session, Room, User as UserType, Activity, Group, UserRole } from "@/types/schema";
import { Filter, Users, MapPin, Plus, Loader2, Calendar as CalendarIcon, Info, Repeat } from "lucide-react";
import { Views, View } from "react-big-calendar";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";
import { createSessionAction, deleteSessionAction } from "@/actions/schedule.actions";
import { useRouter } from "@/i18n/routing";
import { clsx } from "clsx";

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
  const [isPending, startTransition] = useTransition();
  const [isWeekly, setIsWeekly] = useState(false);
  const [weeksCount, setWeeksCount] = useState(4);
  const t = useTranslations();
  const router = useRouter();

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
        const group = (groups || []).find(g => g.id === session.groupId);

        return {
          id: session.id,
          title: `${group?.name || t("unknown")} - ${activity?.name || t("unknown")}`,
          start: new Date(session.startTime),
          end: new Date(session.endTime),
          resource: {
            color: activity?.color,
            instructorName: formatFullName(instructor?.firstName, instructor?.lastName),
            roomName: room?.name,
          }
        };
      });
  }, [selectedRoom, selectedInstructor, sessions, activitiesMap, roomsMap, staffMap, groups, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      activityId: formData.get("activityId") as string,
      roomId: formData.get("roomId") as string,
      instructorId: formData.get("instructorId") as string,
      groupId: (formData.get("groupId") as string) || null,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      isWeekly,
      weeksCount: isWeekly ? weeksCount : 1,
    };

    startTransition(async () => {
      const result = await createSessionAction(data);
      if (result.success) {
        setIsModalOpen(false);
        setIsWeekly(false);
        setWeeksCount(4);
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    startTransition(async () => {
      const result = await deleteSessionAction({ id });
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col space-y-6 h-full animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-teal/10 text-primary-teal rounded-2xl shadow-sm">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("planning")}</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t("rooms_subtitle")}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setIsModalOpen(true);
            if (navigator.vibrate) navigator.vibrate(50);
          }}
          className="flex items-center gap-2 rounded-xl bg-primary-teal px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-teal/30 hover:bg-primary-teal/90 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          Planifier une séance
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 flex-1 min-w-[200px]">
          <MapPin size={18} className="text-gray-400" />
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
          >
            <option value="all">Toutes les salles</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 flex-1 min-w-[200px]">
          <Users size={18} className="text-gray-400" />
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
          >
            <option value="all">Tous les intervenants</option>
            {instructors.map(inst => (
              <option key={inst.id} value={inst.id}>{formatFullName(inst.firstName, inst.lastName)}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-4 border-l pl-4">
           <button 
              onClick={() => setCalendarView(Views.DAY)}
              className={clsx("px-4 py-2 text-xs font-black rounded-xl transition-all", calendarView === Views.DAY ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-100")}
           >
             JOUR
           </button>
           <button 
              onClick={() => setCalendarView(Views.WEEK)}
              className={clsx("px-4 py-2 text-xs font-black rounded-xl transition-all", calendarView === Views.WEEK ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-100")}
           >
             SEMAINE
           </button>
           <button 
              onClick={() => setCalendarView(Views.MONTH)}
              className={clsx("px-4 py-2 text-xs font-black rounded-xl transition-all", calendarView === Views.MONTH ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-100")}
           >
             MOIS
           </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 w-full bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        <TaysirCalendar 
          events={filteredEvents} 
          view={calendarView}
          onView={(view) => setCalendarView(view)}
          onSelectEvent={(event) => {
            if (confirm(`Voulez-vous supprimer la séance: ${event.title} ?`)) {
              handleDelete(event.id as string);
            }
          }}
        />
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle Planification"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button 
              disabled={isPending} 
              onClick={() => setIsModalOpen(false)} 
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button 
              form="session-form"
              type="submit"
              disabled={isPending} 
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-teal text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-teal/20 hover:bg-primary-teal/90 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending && <Loader2 size={18} className="animate-spin" />}
              Enregistrer la séance
            </button>
          </div>
        }
      >
        <form id="session-form" onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Section: Activity & Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
             <div className="md:col-span-2">
                <Select 
                  name="activityId"
                  label="Type d'Activité" 
                  options={activities.map(a => ({ label: a.name, value: a.id }))} 
                  required
                />
             </div>
             <Select 
                name="groupId"
                label="Groupe d'élèves" 
                options={[{ label: "Sélectionner un groupe", value: "" }, ...groups.map(g => ({ label: g.name, value: g.id }))]} 
                required
             />
             <Select 
              name="roomId"
              label="Salle de cours" 
              options={rooms.map(r => ({ label: r.name, value: r.id }))} 
              required
            />
          </div>

          {/* Section: Teacher */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <Select 
              name="instructorId"
              label="Intervenant (Professeur)" 
              options={instructors.map(i => ({ label: formatFullName(i.firstName, i.lastName), value: i.id }))} 
              required
            />
          </div>

          {/* Section: DateTime */}
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <Input name="date" label="Date de début" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <Input name="startTime" label="Heure" type="time" defaultValue="09:00" required />
          </div>

          {/* Section: Recurrence */}
          <div className="bg-accent-teal/5 p-5 rounded-2xl border border-accent-teal/10 space-y-4">
             <Toggle 
                enabled={isWeekly}
                onChange={setIsWeekly}
                label="Séances hebdomadaires"
                description="Répéter automatiquement cette séance chaque semaine."
             />
             
             {isWeekly && (
               <div className="flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex-1">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                      Nombre de semaines
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="52"
                      value={weeksCount}
                      onChange={(e) => setWeeksCount(parseInt(e.target.value))}
                      className="w-full bg-white rounded-xl border-gray-200 py-2.5 px-4 text-sm font-bold text-gray-900 shadow-sm focus:border-accent-teal focus:ring-4 focus:ring-accent-teal/5 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5 text-accent-teal bg-white px-4 py-2.5 rounded-xl border border-accent-teal/20 shadow-sm">
                    <Repeat size={18} />
                    <span className="text-xs font-bold uppercase">Récursion</span>
                  </div>
               </div>
             )}
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
             <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-xs text-blue-700 font-medium leading-relaxed">
               La durée de la séance sera automatiquement calculée en fonction du type d'activité sélectionné.
             </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
