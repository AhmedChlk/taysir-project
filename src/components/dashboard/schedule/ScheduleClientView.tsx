"use client";

import type { Prisma } from "@prisma/client";
import { addDays, format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
	BookOpen,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Loader2,
	MapPin,
	Plus,
	Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import TaysirAgenda from "@/components/calendar/TaysirCalendar";
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
}

export default function ScheduleClientView({
	initialSessions,
	rooms,
	staff,
	groups,
	currentDate,
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

	const nextWeek = () => {
		const date = addDays(currentDate, 7);
		updateFilters({ date: date.toISOString() });
	};

	const prevWeek = () => {
		const date = subDays(currentDate, 7);
		updateFilters({ date: date.toISOString() });
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

	return (
		<div className="flex flex-col h-screen max-h-[calc(100vh-100px)] space-y-8 overflow-hidden px-1 pb-6">
			{/* Floating Header */}
			<motion.div
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0"
			>
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 shadow-inner">
							<CalendarIcon size={20} />
						</div>
						<div className="t-eyebrow !mb-0">
							{t("schedule_manage_title") || "Gestion du planning"}
						</div>
					</div>
					<h1 className="text-4xl font-black text-ink-900 tracking-tight">
						Agenda de l'<span className="text-brand-500">Établissement</span>
					</h1>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center bg-white border border-line rounded-2xl p-1.5 shadow-ts-1">
						<button
							onClick={prevWeek}
							className="p-2.5 hover:bg-surface-50 rounded-xl transition-all text-ink-400 hover:text-ink-900 active:scale-90"
						>
							<ChevronLeft size={20} />
						</button>
						<div className="px-6 text-sm font-black text-ink-900 min-w-[200px] text-center tabular-nums">
							{format(currentDate, "dd MMMM yyyy", { locale: fr })}
						</div>
						<button
							onClick={nextWeek}
							className="p-2.5 hover:bg-surface-50 rounded-xl transition-all text-ink-400 hover:text-ink-900 active:scale-90"
						>
							<ChevronRight size={20} />
						</button>
					</div>
					<button
						onClick={() => updateFilters({ drawer: "new-session" })}
						className="h-14 px-8 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:bg-brand-600 hover:shadow-2xl hover:shadow-brand-500/30 active:scale-95 group"
					>
						<Plus
							size={20}
							className="group-hover:rotate-90 transition-transform duration-500"
						/>
						Planifier
					</button>
				</div>
			</motion.div>

			{/* Advanced Filter Bar (Glassmorphism) */}
			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.1 }}
				className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-[32px] border border-line shadow-ts-2 shrink-0 relative z-10"
			>
				<div className="flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-line focus-within:border-brand-500 transition-colors group/select">
					<MapPin
						size={18}
						className="text-ink-300 group-focus-within/select:text-brand-500 transition-colors"
					/>
					<select
						value={currentRoomId}
						onChange={(e) => updateFilters({ roomId: e.target.value })}
						className="flex-1 bg-transparent border-none text-xs font-black text-ink-900 uppercase tracking-wider focus:ring-0 cursor-pointer p-0"
					>
						<option value="all">Toutes les salles</option>
						{roomOptions}
					</select>
				</div>

				<div className="flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-line focus-within:border-brand-500 transition-colors group/select">
					<Users
						size={18}
						className="text-ink-300 group-focus-within/select:text-brand-500 transition-colors"
					/>
					<select
						value={currentInstructorId}
						onChange={(e) => updateFilters({ instructorId: e.target.value })}
						className="flex-1 bg-transparent border-none text-xs font-black text-ink-900 uppercase tracking-wider focus:ring-0 cursor-pointer p-0"
					>
						<option value="all">Tous les professeurs</option>
						{instructorOptions}
					</select>
				</div>

				<div className="flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-line focus-within:border-brand-500 transition-colors group/select">
					<BookOpen
						size={18}
						className="text-ink-300 group-focus-within/select:text-brand-500 transition-colors"
					/>
					<select
						value={currentGroupId}
						onChange={(e) => updateFilters({ groupId: e.target.value })}
						className="flex-1 bg-transparent border-none text-xs font-black text-ink-900 uppercase tracking-wider focus:ring-0 cursor-pointer p-0"
					>
						<option value="all">Tous les groupes</option>
						{groupOptions}
					</select>
				</div>

				<div className="flex items-center justify-end px-4">
					{isPending ? (
						<div className="flex items-center gap-3 text-ink-400 text-xs font-black uppercase tracking-widest animate-pulse">
							<Loader2 size={18} className="animate-spin text-brand-500" />{" "}
							SYNC...
						</div>
					) : (
						<div className="flex items-center gap-3">
							<div className="px-3 py-1 bg-success/10 text-success rounded-full flex items-center gap-2">
								<div className="w-1.5 h-1.5 bg-success rounded-full animate-ping" />
								<span className="text-[10px] font-black uppercase tracking-widest">
									Live
								</span>
							</div>
						</div>
					)}
				</div>
			</motion.div>

			{/* Main Calendar View */}
			<motion.div
				initial={{ scale: 0.98, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.2 }}
				className={cn(
					"flex-1 relative transition-all duration-700 bg-white rounded-[40px] border border-line shadow-ts-3 overflow-hidden",
					isPending && "opacity-50 grayscale pointer-events-none",
				)}
			>
				<div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
					<TaysirAgenda sessions={initialSessions} currentDate={currentDate} />
				</div>

				<AnimatePresence>
					{isPending && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-[4px]"
						>
							<div className="bg-white p-8 rounded-3xl shadow-2xl border border-line flex flex-col items-center gap-5">
								<div className="w-12 h-12 rounded-full border-4 border-brand-50 border-t-brand-500 animate-spin" />
								<span className="text-xs font-black text-ink-900 uppercase tracking-[0.2em]">
									Mise à jour...
								</span>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
