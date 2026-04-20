"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-overrides.css";

import type { Activity, Groupe, Room, Session, User } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

const locales = {
	fr: fr,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
	getDay,
	locales,
});

type SessionWithRelations = Session & {
	room: Pick<Room, "name" | "capacity">;
	activity: Pick<Activity, "name" | "color">;
	group: Pick<Groupe, "name">;
	instructor?: Pick<User, "firstName" | "lastName" | "avatarUrl">;
};

interface TaysirCalendarProps {
	sessions: SessionWithRelations[];
	currentDate: Date;
}

export default function TaysirCalendar({
	sessions,
	currentDate,
}: TaysirCalendarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const events = sessions.map((s) => ({
		id: s.id,
		title: `${s.activity.name} - ${s.group.name}`,
		start: new Date(s.startTime),
		end: new Date(s.endTime),
		resource: s,
	}));

	const handleSelectEvent = (event: (typeof events)[number]) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("drawer", "view-session");
		params.set("id", event.id);
		router.push(`?${params.toString()}`, { scroll: false });
	};

	const handleSelectSlot = ({ start }: { start: Date }) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("drawer", "new-session");
		params.set("start", start.toISOString());
		router.push(`?${params.toString()}`, { scroll: false });
	};

	const eventPropGetter = (event: (typeof events)[number]) => {
		return {
			style: {
				backgroundColor: event.resource.activity.color || "#0F515C",
				borderRadius: "12px",
				border: "none",
				color: "white",
				fontSize: "11px",
				fontWeight: "bold",
				padding: "4px 8px",
				boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
			},
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
					params.set("date", date.toISOString());
					router.push(`?${params.toString()}`, { scroll: false });
				}}
				onSelectEvent={handleSelectEvent}
				onSelectSlot={handleSelectSlot}
				selectable
				views={["month", "week", "day"]}
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
