"use client";

import type { Prisma } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import {
	BookOpen,
	Calendar as CalendarIcon,
	MapPin,
	Plus,
	Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import TaysirAgenda from "@/components/calendar/TaysirCalendar";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import type { Activity, Group, Room, User as UserType } from "@/types/schema";
import { cn, formatFullName } from "@/utils/format";

type SessionWithRelations = Prisma.SessionGetPayload<{
	include: {
		room: { select: { name: true; capacity: true } };
		activity: { select: { name: true; color: true } };
		group: { select: { name: true } };
		instructor: {
			select: { firstName: true; lastName: true; avatarUrl: true };
		};
	};
}>;

interface ScheduleClientViewProps {
	initialSessions: SessionWithRelations[];
	rooms: Room[];
	staff: UserType[];
	activities: Activity[];
	groups: Group[];
	currentDate: Date;
	/** Vue intervenant : planning restreint à ses séances, sans filtres ni création. */
	isInstructor?: boolean;
}

export default function ScheduleClientView({
	initialSessions,
	rooms,
	staff,
	groups,
	currentDate,
	isInstructor = false,
}: ScheduleClientViewProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const t = useTranslations();

	// Filtres actuels (issus de l'URL)
	const currentRoomId = searchParams.get("roomId") || "all";
	const currentInstructorId = searchParams.get("instructorId") || "all";
	const currentGroupId = searchParams.get("groupId") || "all";

	const updateFilters = (newParams: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams.toString());
		Object.entries(newParams).forEach(([key, value]) => {
			if (value === "all" || value === null) params.delete(key);
			else params.set(key, value);
		});

		startTransition(() => {
			router.push(`?${params.toString()}`, { scroll: false });
		});
	};

	const instructors = useMemo(
		() => staff.filter((u) => u.role === "INTERVENANT" || u.role === "GERANT"),
		[staff],
	);

	const roomOptions = useMemo(
		() =>
			rooms.map((r) => (
				<option key={r.id} value={r.id}>
					{r.name}
				</option>
			)),
		[rooms],
	);

	const instructorOptions = useMemo(
		() =>
			instructors.map((i) => (
				<option key={i.id} value={i.id}>
					{formatFullName(i.firstName, i.lastName)}
				</option>
			)),
		[instructors],
	);

	const groupOptions = useMemo(
		() =>
			groups.map((g) => (
				<option key={g.id} value={g.id}>
					{g.name}
				</option>
			)),
		[groups],
	);

	// Cibles ≥ 36px, jeton de surface unique, focus marque.
	const selectShell =
		"flex items-center gap-3 px-4 h-11 bg-surface-white rounded-xl border border-line/60 focus-within:border-brand-400 transition-colors group/select";
	const selectField =
		"flex-1 bg-transparent border-none text-sm font-medium text-ink-900 focus:ring-0 cursor-pointer p-0";
	const selectIcon =
		"text-ink-300 group-focus-within/select:text-brand-500 transition-colors";

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={
					<span className="inline-flex items-center gap-2">
						<CalendarIcon size={14} />
						{t("schedule_manage_title") || "Gestion du planning"}
					</span>
				}
				title={
					isInstructor ? t("schedule_my_title") : t("schedule_agenda_title")
				}
				accent={isInstructor ? "" : t("default_school_name")}
				subtitle={
					isInstructor ? t("schedule_my_subtitle") : t("schedule_subtitle")
				}
				actions={
					isInstructor ? undefined : (
						<Button
							onClick={() => updateFilters({ drawer: "new-session" })}
							className="group"
							icon={
								<Plus
									size={18}
									className="transition-transform duration-300 group-hover:rotate-90"
								/>
							}
						>
							{t("schedule_plan_button")}
						</Button>
					)
				}
			/>

			{/* Barre de filtres — masquée pour l'intervenant (planning restreint). */}
			{!isInstructor && (
				<Card className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className={selectShell}>
						<MapPin size={18} className={selectIcon} />
						<select
							value={currentRoomId}
							onChange={(e) => updateFilters({ roomId: e.target.value })}
							className={selectField}
						>
							<option value="all">{t("schedule_all_rooms")}</option>
							{roomOptions}
						</select>
					</div>

					<div className={selectShell}>
						<Users size={18} className={selectIcon} />
						<select
							value={currentInstructorId}
							onChange={(e) => updateFilters({ instructorId: e.target.value })}
							className={selectField}
						>
							<option value="all">{t("schedule_all_teachers")}</option>
							{instructorOptions}
						</select>
					</div>

					<div className={selectShell}>
						<BookOpen size={18} className={selectIcon} />
						<select
							value={currentGroupId}
							onChange={(e) => updateFilters({ groupId: e.target.value })}
							className={selectField}
						>
							<option value="all">{t("schedule_all_groups")}</option>
							{groupOptions}
						</select>
					</div>
				</Card>
			)}

			{/* Vue calendrier */}
			<Card
				pad={false}
				className={cn(
					"relative overflow-hidden h-[calc(100vh-300px)] min-h-[600px] transition-opacity duration-500",
					isPending && "opacity-60 pointer-events-none",
				)}
			>
				<div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
					<TaysirAgenda sessions={initialSessions} currentDate={currentDate} />
				</div>

				<AnimatePresence>
					{isPending && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[3px]"
						>
							<div className="flex flex-col items-center gap-4 rounded-2xl border border-line/60 bg-surface-white p-8 shadow-ts-2">
								<div className="h-10 w-10 rounded-full border-4 border-brand-50 border-t-brand-500 animate-spin" />
								<span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-900">
									Mise à jour...
								</span>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</Card>
		</div>
	);
}
