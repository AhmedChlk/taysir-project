"use client";

import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr, ar } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-overrides.css";

const locales = {
  fr: fr,
  ar: ar,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    color?: string | null;
    [key: string]: unknown;
  };
}

interface TaysirCalendarProps {
  events: CalendarEvent[];
  view?: View;
  onView?: (view: View) => void;
  rtl?: boolean;
  onSelectEvent?: (event: CalendarEvent) => void;
}

export default function TaysirCalendar({
  events,
  view = Views.WEEK,
  onView,
  rtl: propsRtl,
  onSelectEvent,
}: TaysirCalendarProps) {
  // Use prop if provided, otherwise detect from document
  const isRtl = propsRtl !== undefined ? propsRtl : (typeof document !== 'undefined' && document.dir === 'rtl');
  
  const messages = isRtl 
    ? {
        next: "التالي",
        previous: "السابق",
        today: "اليوم",
        month: "شهر",
        week: "أسبوع",
        day: "يوم",
        agenda: "جدول أعمال",
        allDay: "طوال اليوم",
        date: "تاريخ",
        time: "وقت",
        event: "حدث",
        noEventsInRange: "لا توجد أحداث في هذا النطاق",
      }
    : {
        next: "Suivant",
        previous: "Précédent",
        today: "Aujourd'hui",
        month: "Mois",
        week: "Semaine",
        day: "Jour",
        agenda: "Agenda",
      };

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={onView}
        culture={isRtl ? "ar" : "fr"}
        rtl={isRtl}
        onSelectEvent={onSelectEvent}
        messages={messages}
        eventPropGetter={(event: CalendarEvent) => ({
          className: "taysir-event",
          style: {
            backgroundColor: event.resource?.color || "#0F515C",
            borderLeft: isRtl ? "none" : "4px solid rgba(0,0,0,0.1)",
            borderRight: isRtl ? "4px solid rgba(0,0,0,0.1)" : "none",
          },
        })}
      />
    </div>
  );
}
