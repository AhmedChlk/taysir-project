"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { arDZ, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useMemo } from "react";
import type { Components, EventPropGetter } from "react-big-calendar";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop, {
	type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import {
	localizedGroup,
	localizedRoom,
	localizedSubject,
} from "@/lib/subjects";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-overrides.css";

import type { Activity, Groupe, Room, Session, User } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	updateSeriesAction,
	updateSessionAction,
} from "@/actions/schedule.actions";

type SessionWithRelations = Session & {
	room: Pick<Room, "name" | "capacity">;
	activity: Pick<Activity, "name" | "color">;
	group: Pick<Groupe, "name">;
	instructor?: Pick<User, "firstName" | "lastName" | "avatarUrl">;
};

interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: SessionWithRelations;
}

const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

const locales = {
	fr: fr,
	"ar-DZ": arDZ,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
	getDay,
	locales,
});

interface TaysirCalendarProps {
	sessions: SessionWithRelations[];
	currentDate: Date;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const CalendarEventComponent = ({ event }: { event: CalendarEvent }) => {
	const locale = useLocale();
	const r = event.resource;
	const activity = localizedSubject(r.activity.name, locale);
	const room = localizedRoom(r.room.name, locale);
	const group = localizedGroup(r.group.name, locale);
	// Infobulle complète : reste lisible même quand plusieurs séances se
	// chevauchent et sont réduites à des colonnes étroites (écoles à plusieurs
	// salles = cours en parallèle au même créneau).
	const tooltip = `${hhmm(event.start)}–${hhmm(event.end)} · ${activity} · ${group} · ${room}`;
	return (
		<div
			title={tooltip}
			className="flex flex-col h-full overflow-hidden leading-tight"
		>
			<div className="flex items-center gap-1">
				<span className="truncate font-bold">{activity}</span>
			</div>
			<div className="text-[9px] opacity-80 truncate hidden md:block">
				{group}
			</div>
		</div>
	);
};

const TaysirCalendar = React.memo(function TaysirCalendar({
	sessions,
	currentDate,
}: TaysirCalendarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const locale = useLocale();
	const t = useTranslations();
	// Culture react-big-calendar : arabe (Algérie) ou français.
	const culture = locale === "ar" ? "ar-DZ" : "fr";
	const [pendingMove, setPendingMove] = React.useState<{
		event: CalendarEvent;
		start: Date;
		end: Date;
	} | null>(null);
	const [isUpdating, setIsUpdating] = React.useState(false);

	const events: CalendarEvent[] = useMemo(
		() =>
			sessions.map((s) => ({
				id: s.id,
				title: `${s.activity.name} - ${s.group.name}`,
				start: new Date(s.startTime),
				end: new Date(s.endTime),
				resource: s,
			})),
		[sessions],
	);

	const components = useMemo<Components<CalendarEvent, object>>(
		() => ({
			event: CalendarEventComponent,
		}),
		[],
	);

	// Grille horaire sur 24h (00:00 → 23:59) — couvre les cours du soir / de nuit.
	// La vue s'ouvre autour de 08:00 mais reste défilable sur toute la journée.
	// Seules les heures/minutes de ces Date sont prises en compte par react-big-calendar.
	const { minTime, maxTime, scrollToTime } = useMemo(() => {
		const at = (hour: number, min = 0) => {
			const d = new Date(currentDate);
			d.setHours(hour, min, 0, 0);
			return d;
		};
		return { minTime: at(0), maxTime: at(23, 59), scrollToTime: at(8) };
	}, [currentDate]);

	const handleConfirmMove = async (mode: "single" | "following" | "all") => {
		if (!pendingMove) return;
		setIsUpdating(true);

		try {
			if (mode === "single" || !pendingMove.event.resource.recurrenceGroupId) {
				await updateSessionAction({
					id: pendingMove.event.id,
					startTime: pendingMove.start,
					endTime: pendingMove.end,
				});
			} else {
				await updateSeriesAction({
					recurrenceGroupId: pendingMove.event.resource.recurrenceGroupId,
					startTime: pendingMove.start,
					endTime: pendingMove.end,
					mode: mode === "following" ? "FOLLOWING" : "ALL",
					currentSessionId: pendingMove.event.id,
				});
			}
			router.refresh();
		} finally {
			setIsUpdating(false);
			setPendingMove(null);
		}
	};

	const handleSelectEvent = useCallback(
		(event: CalendarEvent) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("drawer", "view-session");
			params.set("id", event.id);
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[searchParams, router],
	);

	const handleSelectSlot = useCallback(
		({ start, end }: { start: Date; end: Date }) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("drawer", "new-session");
			params.set("start", start.toISOString());
			params.set("end", end.toISOString());
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[searchParams, router],
	);

	const onEventDrop = useCallback(
		async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
			const newStart = new Date(start);
			const newEnd = new Date(end);

			if (event.resource.recurrenceGroupId) {
				setPendingMove({ event, start: newStart, end: newEnd });
			} else {
				const result = await updateSessionAction({
					id: event.id,
					startTime: newStart,
					endTime: newEnd,
				});
				if (result?.success) {
					router.refresh();
				}
			}
		},
		[router],
	);

	const onEventResize = useCallback(
		async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
			const newStart = new Date(start);
			const newEnd = new Date(end);

			if (event.resource.recurrenceGroupId) {
				setPendingMove({ event, start: newStart, end: newEnd });
			} else {
				const result = await updateSessionAction({
					id: event.id,
					startTime: newStart,
					endTime: newEnd,
				});
				if (result?.success) {
					router.refresh();
				}
			}
		},
		[router],
	);

	const onNavigate = useCallback(
		(date: Date) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("date", date.toISOString());
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[searchParams, router],
	);

	const eventPropGetter = useCallback<EventPropGetter<CalendarEvent>>(
		(event) => {
			return {
				style: {
					backgroundColor: event.resource.activity.color || "#0F515C",
					borderRadius: "10px",
					border: "1px solid white",
					color: "white",
					fontSize: "10px",
					fontWeight: "bold",
					padding: "2px 4px",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
					opacity: 0.9,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				},
			};
		},
		[],
	);

	return (
		<div className="h-full relative">
			<DnDCalendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				date={currentDate}
				min={minTime}
				max={maxTime}
				scrollToTime={scrollToTime}
				components={components}
				onNavigate={onNavigate}
				onSelectEvent={handleSelectEvent}
				onSelectSlot={handleSelectSlot}
				onEventDrop={onEventDrop}
				onEventResize={onEventResize}
				selectable
				resizable
				views={["month", "week", "day"]}
				defaultView={Views.WEEK}
				eventPropGetter={eventPropGetter}
				messages={{
					next: t("calendar_next"),
					previous: t("calendar_previous"),
					today: t("today_label"),
					month: t("calendar_month"),
					week: t("calendar_week"),
					day: t("calendar_day"),
					agenda: t("calendar_agenda"),
				}}
				culture={culture}
				className="taysir-calendar-override"
			/>

			{/* Modal de confirmation Google Calendar Style */}
			<AnimatePresence>
				{pendingMove && (
					<div className="absolute inset-0 z-[200] flex items-center justify-center bg-brand-900/10 backdrop-blur-sm rounded-2xl">
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="bg-white p-8 rounded-[32px] shadow-2xl border border-line max-w-md w-full mx-4 space-y-6"
						>
							<div className="flex items-center gap-4 text-brand-900">
								<div className="p-3 bg-brand-50 rounded-2xl text-brand-500">
									<AlertCircle size={24} />
								</div>
								<h3 className="text-xl font-bold tracking-tight">
									{t("series_edit_title")}
								</h3>
							</div>

							<p className="text-sm text-ink-500 font-medium leading-relaxed">
								{t("series_edit_question")}
							</p>

							<div className="grid grid-cols-1 gap-2">
								<button
									type="button"
									disabled={isUpdating}
									onClick={() => handleConfirmMove("single")}
									className="p-4 rounded-2xl border border-line hover:border-brand-500 hover:bg-brand-50/50 text-start transition-all group"
								>
									<p className="font-bold text-ink-900 text-sm">
										{t("series_only_this")}
									</p>
								</button>
								<button
									type="button"
									disabled={isUpdating}
									onClick={() => handleConfirmMove("following")}
									className="p-4 rounded-2xl border border-line hover:border-brand-500 hover:bg-brand-50/50 text-start transition-all"
								>
									<p className="font-bold text-ink-900 text-sm">
										{t("series_this_and_following")}
									</p>
								</button>
								<button
									type="button"
									disabled={isUpdating}
									onClick={() => handleConfirmMove("all")}
									className="p-4 rounded-2xl border border-line hover:border-brand-500 hover:bg-brand-50/50 text-start transition-all"
								>
									<p className="font-bold text-ink-900 text-sm">
										{t("series_all")}
									</p>
								</button>
							</div>

							<button
								type="button"
								onClick={() => setPendingMove(null)}
								className="w-full py-2 text-xs font-bold text-ink-400 uppercase tracking-widest hover:text-ink-900 transition-colors"
							>
								{t("series_cancel_move")}
							</button>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
});

export default TaysirCalendar;
