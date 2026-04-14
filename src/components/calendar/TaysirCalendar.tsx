'use client';

import React from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-overrides.css';
import { useRouter, useSearchParams } from 'next/navigation';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface TaysirCalendarProps {
  sessions: any[];
  currentDate: Date;
}

export default function TaysirCalendar({ sessions, currentDate }: TaysirCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const events = sessions.map(s => ({
    id: s.id,
    title: `${s.activity.name} - ${s.group.name}`,
    start: new Date(s.startTime),
    end: new Date(s.endTime),
    resource: s,
  }));

  const handleSelectEvent = (event: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('drawer', 'view-session');
    params.set('id', event.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSelectSlot = ({ start }: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('drawer', 'new-session');
    params.set('start', start.toISOString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const eventPropGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.resource.activity.color || '#0F515C',
        borderRadius: '12px',
        border: 'none',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      }
    };
  };

  return (
    <div className="h-full min-h-[700px] p-4 bg-white rounded-[32px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={(date) => {
           const params = new URLSearchParams(searchParams.toString());
           params.set('date', date.toISOString());
           router.push(`?${params.toString()}`, { scroll: false });
        }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        views={['month', 'week', 'day']}
        defaultView={Views.WEEK}
        eventPropGetter={eventPropGetter}
        messages={{
          next: "Suivant",
          previous: "Précédent",
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
        }}
        culture="fr"
        className="taysir-calendar-override"
      />
    </div>
  );
}
