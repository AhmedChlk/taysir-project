"use client";

import type { Prisma } from "@prisma/client";
import { addDays, format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
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
	activities,
	groups,
	currentDate,
}: ScheduleClientViewProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

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

	return (
		<div className="flex flex-col h-screen max-h-[calc(100vh-120px)] space-y-6 overflow-hidden">
			{/* Header Planning Command Center */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
				<div className="flex items-center gap-4">
					<div className="p-4 bg-taysir-teal text-white rounded-3xl shadow-lg shadow-taysir-teal/20">
						<CalendarIcon size={24} />
					</div>
					<div>
						<h1 className="text-2xl font-black text-taysir-teal uppercase tracking-tighter">
							Agenda Établissement
						</h1>
						<p className="text-xs font-bold text-taysir-teal/40 uppercase tracking-widest">
							Gestion du Planning & Occupation
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex items-center bg-white border border-taysir-teal/5 rounded-2xl p-1 shadow-sm">
						<button
							onClick={prevWeek}
							className="p-2 hover:bg-taysir-teal/5 rounded-xl transition-colors text-taysir-teal"
						>
							<ChevronLeft size={20} />
						</button>
						<div className="px-4 text-sm font-black text-taysir-teal uppercase tracking-tighter min-w-[180px] text-center">
							Semaine du {format(currentDate, "dd MMMM", { locale: fr })}
						</div>
						<button
							onClick={nextWeek}
							className="p-2 hover:bg-taysir-teal/5 rounded-xl transition-colors text-taysir-teal"
						>
							<ChevronRight size={20} />
						</button>
					</div>
					<button
						onClick={() => updateFilters({ drawer: "new-session" })}
						className="btn-primary flex items-center gap-2 shadow-lg shadow-taysir-teal/10"
					>
						<Plus size={20} />{" "}
						<span className="hidden md:inline">Planifier</span>
					</button>
				</div>
			</div>

			{/* Barre de Filtres Intelligents */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/50 backdrop-blur-md p-4 rounded-[32px] border border-taysir-teal/5 shadow-sm shrink-0">
				<div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-taysir-teal/5">
					<MapPin size={16} className="text-taysir-teal/30" />
					<select
						value={currentRoomId}
						onChange={(e) => updateFilters({ roomId: e.target.value })}
						className="flex-1 bg-transparent border-none text-xs font-black text-taysir-teal uppercase focus:ring-0 cursor-pointer"
					>
						<option value="all">Toutes les Salles</option>
						{rooms.map((r) => (
							<option key={r.id} value={r.id}>
								{r.name}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-taysir-teal/5">
					<Users size={16} className="text-taysir-teal/30" />
					<select
						value={currentInstructorId}
						onChange={(e) => updateFilters({ instructorId: e.target.value })}
						className="flex-1 bg-transparent border-none text-xs font-black text-taysir-teal uppercase focus:ring-0 cursor-pointer"
					>
						<option value="all">Tous les Professeurs</option>
						{instructors.map((i) => (
							<option key={i.id} value={i.id}>
								{formatFullName(i.firstName, i.lastName)}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-taysir-teal/5">
					<BookOpen size={16} className="text-taysir-teal/30" />
					<select
						value={currentGroupId}
						onChange={(e) => updateFilters({ groupId: e.target.value })}
						className="flex-1 bg-transparent border-none text-xs font-black text-taysir-teal uppercase focus:ring-0 cursor-pointer"
					>
						<option value="all">Tous les Groupes</option>
						{groups.map((g) => (
							<option key={g.id} value={g.id}>
								{g.name}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center justify-end px-4">
					{isPending ? (
						<div className="flex items-center gap-2 text-taysir-teal/40 text-[10px] font-bold uppercase animate-pulse">
							<Loader2 size={14} className="animate-spin" /> Synchronisation...
						</div>
					) : (
						<div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase">
							<div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />{" "}
							Agenda à jour
						</div>
					)}
				</div>
			</div>

			{/* Zone Agenda avec Transition */}
			<div
				className={cn(
					"flex-1 relative transition-all duration-500 bg-white rounded-[32px] border border-taysir-teal/5 shadow-sm overflow-hidden",
					isPending
						? "opacity-50 grayscale scale-[0.99] pointer-events-none"
						: "opacity-100 grayscale-0 scale-100",
				)}
			>
				<div className="absolute inset-0 overflow-y-auto custom-scrollbar p-2">
					<TaysirAgenda sessions={initialSessions} currentDate={currentDate} />
				</div>

				{/* Overlay Skeleton simple pour éviter le Layout Shift */}
				{isPending && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[32px]">
						<div className="bg-white p-6 rounded-3xl shadow-2xl border border-taysir-teal/5 flex flex-col items-center gap-4">
							<Loader2 size={32} className="text-taysir-teal animate-spin" />
							<span className="text-xs font-black text-taysir-teal uppercase tracking-tighter">
								Chargement de la semaine...
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
