"use client";

import { StatutPresence } from "@prisma/client";
import {
	CalendarPlus,
	Check,
	Clock,
	MessageCircle,
	Save,
	UserCheck,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import {
	type ReactNode,
	useCallback,
	useMemo,
	useState,
	useTransition,
} from "react";
import { bulkMarkPresenceAction } from "@/actions/logistics.actions";
import {
	Button,
	Card,
	PageHeader,
	SectionEmpty,
} from "@/components/ui/primitives";
import { Link } from "@/i18n/routing";
import { localizedGroup, localizedSubject } from "@/lib/subjects";
import {
	buildAbsenceMessage,
	buildWaUrl,
	normalizeDzPhone,
} from "@/lib/wa-relance";
import type { AttendanceRecord, Group, Session, Student } from "@/types/schema";
import { cn, formatDate, formatFullName, formatTime } from "@/utils/format";

type Translator = ReturnType<typeof useTranslations>;

type StatusVariant = "present" | "late" | "absent" | "justified";

type StatusChangeHandler = (studentId: string, status: StatutPresence) => void;
type NoteChangeHandler = (studentId: string, note: string) => void;

/* Status === the only place colour lives on this page:
   présent → emerald · retard → brass · absent → accent (coral) · justifié → brand. */
const STATUS_META: Record<
	StatusVariant,
	{
		status: StatutPresence;
		pill: string;
		dot: string;
		active: string;
		idle: string;
	}
> = {
	present: {
		status: StatutPresence.PRESENT,
		pill: "bg-emerald-50 text-emerald-700",
		dot: "bg-emerald-500",
		active: "bg-emerald-500 text-white border-emerald-500 shadow-sm",
		idle: "bg-surface-white text-ink-400 border-line/70 hover:border-emerald-300 hover:text-emerald-600",
	},
	late: {
		status: StatutPresence.RETARD,
		pill: "bg-brass/15 text-brass",
		dot: "bg-brass",
		active: "bg-brass text-white border-brass shadow-sm",
		idle: "bg-surface-white text-ink-400 border-line/70 hover:border-brass/40 hover:text-brass",
	},
	absent: {
		status: StatutPresence.ABSENT,
		pill: "bg-accent-50 text-accent-600",
		dot: "bg-accent",
		active: "bg-accent text-white border-accent shadow-sm",
		idle: "bg-surface-white text-ink-400 border-line/70 hover:border-accent/40 hover:text-accent-600",
	},
	justified: {
		status: StatutPresence.JUSTIFIE,
		pill: "bg-brand-50 text-brand-700",
		dot: "bg-brand-500",
		active: "bg-brand-500 text-white border-brand-500 shadow-sm",
		idle: "bg-surface-white text-ink-400 border-line/70 hover:border-brand-300 hover:text-brand-600",
	},
};

const VARIANT_FOR_STATUS: Record<StatutPresence, StatusVariant> = {
	[StatutPresence.PRESENT]: "present",
	[StatutPresence.RETARD]: "late",
	[StatutPresence.ABSENT]: "absent",
	[StatutPresence.JUSTIFIE]: "justified",
};

interface AttendanceClientViewProps {
	sessions: Session[];
	students: Student[];
	groups: Group[];
	initialAttendance: AttendanceRecord[];
}

interface StudentRowProps {
	student: Student;
	status: StatutPresence | null;
	note: string;
	onStatusChange: StatusChangeHandler;
	onNoteChange: NoteChangeHandler;
	/** Lien WhatsApp d'alerte parent, présent uniquement si l'élève est absent. */
	absenceUrl?: string | null;
	t: Translator;
}

interface StatusButtonProps {
	active: boolean;
	onClick: () => void;
	variant: StatusVariant;
	icon: ReactNode;
	label: string;
	fullWidth?: boolean | undefined;
}

function isSameLocalDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * Séance présélectionnée à l'ouverture de l'appel : on privilégie une séance
 * du jour, la plus proche de « maintenant » (idéal pour le pointage juste après
 * la séance), sinon la séance la plus proche dans le temps.
 */
function pickDefaultSessionId(sessions: Session[]): string {
	if (sessions.length === 0) return "";
	const now = Date.now();
	const today = new Date();
	const todays = sessions.filter((s) =>
		isSameLocalDay(new Date(s.startTime), today),
	);
	const pool = todays.length > 0 ? todays : sessions;
	const best = [...pool].sort(
		(a, b) =>
			Math.abs(new Date(a.startTime).getTime() - now) -
			Math.abs(new Date(b.startTime).getTime() - now),
	)[0];
	return best?.id ?? (sessions[0]?.id as string);
}

export default function AttendanceClientView({
	sessions,
	students,
	groups,
	initialAttendance,
}: AttendanceClientViewProps) {
	const t = useTranslations();
	const locale = useLocale();
	const [isPending, startTransition] = useTransition();

	const [selectedSessionId, setSelectedSessionId] = useState<string>(() =>
		pickDefaultSessionId(sessions),
	);

	// Séances triées par proximité à « maintenant » → la séance du jour /
	// en cours apparaît en tête du sélecteur (rapide sur téléphone).
	const sortedSessions = useMemo(() => {
		const now = Date.now();
		return [...sessions].sort(
			(a, b) =>
				Math.abs(new Date(a.startTime).getTime() - now) -
				Math.abs(new Date(b.startTime).getTime() - now),
		);
	}, [sessions]);

	// Sélection à deux niveaux : d'abord le groupe, puis la séance. Un enseignant
	// peut avoir plusieurs groupes → on ne noie pas toutes les séances dans une
	// seule liste.
	const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
		const def = sessions.find((s) => s.id === pickDefaultSessionId(sessions));
		return def?.groupId ?? "";
	});

	const groupIdsWithSessions = useMemo(() => {
		const ids: string[] = [];
		for (const s of sessions) {
			if (s.groupId && !ids.includes(s.groupId)) ids.push(s.groupId);
		}
		return ids;
	}, [sessions]);

	const sessionsForGroup = useMemo(
		() => sortedSessions.filter((s) => s.groupId === selectedGroupId),
		[sortedSessions, selectedGroupId],
	);

	// Choix d'un groupe → présélectionne sa séance la plus proche de maintenant.
	const handleSelectGroup = useCallback(
		(gid: string) => {
			setSelectedGroupId(gid);
			const now = Date.now();
			const groupSessions = sessions.filter((s) => s.groupId === gid);
			const todays = groupSessions.filter((s) =>
				isSameLocalDay(new Date(s.startTime), new Date()),
			);
			const pool = todays.length > 0 ? todays : groupSessions;
			const best = [...pool].sort(
				(a, b) =>
					Math.abs(new Date(a.startTime).getTime() - now) -
					Math.abs(new Date(b.startTime).getTime() - now),
			)[0];
			if (best) setSelectedSessionId(best.id);
		},
		[sessions],
	);
	const [attendanceState, setAttendanceState] =
		useState<AttendanceRecord[]>(initialAttendance);
	const [dirty, setDirty] = useState(false);

	const { execute: executeBulkSave, status } = useAction(
		bulkMarkPresenceAction as unknown as Parameters<typeof useAction>[0],
		{
			onSuccess: () => setDirty(false),
			onError: () => alert(t("error_occurred")),
		},
	);

	const groupsMap = useMemo(() => {
		return (groups || []).reduce(
			(acc, g) => {
				acc[g.id] = localizedGroup(g.name, locale);
				return acc;
			},
			{} as Record<string, string>,
		);
	}, [groups, locale]);

	const selectedSession = useMemo(
		() => sessions.find((s) => s.id === selectedSessionId),
		[selectedSessionId, sessions],
	);

	const groupName = selectedSession?.groupId
		? groupsMap[selectedSession.groupId]
		: undefined;

	const studentsInGroup = useMemo(() => {
		if (!selectedSession?.groupId) return [];
		const gid = selectedSession.groupId;
		return students.filter((s) => (s.groups || []).some((g) => g.id === gid));
	}, [selectedSession, students]);

	// Libellé de la séance pour le message d'absence (ex. « Maths — mer. 1 juil. 09:00 »).
	const sessionLabel = useMemo(() => {
		if (!selectedSession) return "";
		const act = selectedSession.activity?.name
			? localizedSubject(selectedSession.activity.name, locale)
			: t("session");
		const when = new Date(selectedSession.startTime).toLocaleString(locale, {
			weekday: "long",
			day: "numeric",
			month: "long",
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${act} — ${when}`;
	}, [selectedSession, locale, t]);

	const currentAttendanceMap = useMemo(() => {
		return attendanceState.reduce(
			(acc, a) => {
				if (a.sessionId === selectedSessionId) acc[a.studentId] = a;
				return acc;
			},
			{} as Record<string, AttendanceRecord>,
		);
	}, [attendanceState, selectedSessionId]);

	/* Aucun statut par défaut : l'enseignant marque explicitement chaque élève
	   (null = non marqué). Le bouton « Tout le monde présent » reste dispo pour
	   aller vite quand tout le monde est là. */
	const statusOf = useCallback(
		(studentId: string): StatutPresence | null =>
			currentAttendanceMap[studentId]?.status ?? null,
		[currentAttendanceMap],
	);

	const counts = useMemo(() => {
		const c = { present: 0, late: 0, absent: 0, justified: 0, unmarked: 0 };
		for (const s of studentsInGroup) {
			const st = statusOf(s.id);
			if (st === null) {
				c.unmarked += 1;
				continue;
			}
			c[VARIANT_FOR_STATUS[st]] += 1;
		}
		return { ...c, total: studentsInGroup.length };
	}, [studentsInGroup, statusOf]);

	// Construit le lien WhatsApp d'alerte parent pour un élève absent (sinon null).
	const absenceUrlFor = useCallback(
		(student: Student): string | null => {
			if (statusOf(student.id) !== StatutPresence.ABSENT) return null;
			const phone = normalizeDzPhone(student.parentPhone || student.phone);
			if (!phone) return null;
			const msg = buildAbsenceMessage({
				studentFirstName: student.firstName,
				sessionLabel,
				locale,
			});
			return buildWaUrl(phone, msg);
		},
		[statusOf, sessionLabel, locale],
	);

	const upsertRecord = useCallback(
		(studentId: string, patch: Partial<AttendanceRecord>) => {
			setDirty(true);
			setAttendanceState((prev) => {
				const existing = prev.find(
					(a) => a.studentId === studentId && a.sessionId === selectedSessionId,
				);
				if (existing) {
					return prev.map((a) =>
						a.studentId === studentId && a.sessionId === selectedSessionId
							? { ...a, ...patch }
							: a,
					);
				}
				return [
					...prev,
					{
						id: `temp-${studentId}`,
						sessionId: selectedSessionId,
						studentId,
						status: StatutPresence.PRESENT,
						note: null,
						etablissementId: selectedSession?.etablissementId || "",
						...patch,
					} as AttendanceRecord,
				];
			});
		},
		[selectedSessionId, selectedSession?.etablissementId],
	);

	const handleStatusChange = useCallback(
		(studentId: string, status: StatutPresence) =>
			upsertRecord(studentId, { status }),
		[upsertRecord],
	);

	const handleNoteChange = useCallback(
		(studentId: string, note: string) =>
			upsertRecord(studentId, { note: note || null }),
		[upsertRecord],
	);

	const handleBulkMarkAllPresent = () => {
		setDirty(true);
		setAttendanceState((prev) => {
			const otherSessions = prev.filter(
				(a) => a.sessionId !== selectedSessionId,
			);
			const updated = studentsInGroup.map(
				(student) =>
					({
						id: currentAttendanceMap[student.id]?.id || `temp-${student.id}`,
						sessionId: selectedSessionId,
						studentId: student.id,
						status: StatutPresence.PRESENT,
						note: currentAttendanceMap[student.id]?.note || null,
						etablissementId: selectedSession?.etablissementId || "",
					}) as AttendanceRecord,
			);
			return [...otherSessions, ...updated];
		});
	};

	const handleSave = () => {
		// On n'enregistre que les élèves explicitement marqués (statut non null).
		const records = studentsInGroup
			.map((student) => ({
				studentId: student.id,
				status: statusOf(student.id),
				note: currentAttendanceMap[student.id]?.note || null,
			}))
			.filter(
				(
					r,
				): r is {
					studentId: string;
					status: StatutPresence;
					note: string | null;
				} => r.status !== null,
			);
		startTransition(() => {
			executeBulkSave({ sessionId: selectedSessionId, records });
		});
	};

	const hasSession = Boolean(selectedSession);
	const hasStudents = studentsInGroup.length > 0;
	const saving = isPending || status === "executing";

	return (
		<div className="space-y-8 pb-24 md:pb-8">
			<PageHeader
				eyebrow={t("attendance")}
				title={hasSession ? groupName || t("attendance") : t("attendance")}
				accent={
					selectedSession
						? formatTime(selectedSession.startTime, locale)
						: undefined
				}
				subtitle={
					hasSession
						? `${formatDate(selectedSession?.startTime ?? new Date(), locale)} — marquez chaque élève, puis enregistrez.`
						: "Choisissez une séance pour faire l'appel."
				}
				actions={
					hasStudents ? (
						<>
							<Button
								variant="secondary"
								onClick={handleBulkMarkAllPresent}
								icon={<UserCheck size={18} />}
							>
								{t("mark_all_present")}
							</Button>
							<Button
								variant="primary"
								onClick={handleSave}
								disabled={saving || !dirty}
								icon={<Save size={18} />}
							>
								{saving ? t("saving") : dirty ? t("save") : "Enregistré ✓"}
							</Button>
						</>
					) : undefined
				}
			/>

			{/* Sélection fluide en 2 temps : groupe (si plusieurs) puis séance. */}
			<Card className="space-y-5">
				{/* Étape 1 — le groupe (masquée s'il n'y en a qu'un). */}
				{groupIdsWithSessions.length > 1 && (
					<div className="space-y-2">
						<span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-400">
							<span className="grid h-5 w-5 place-items-center rounded-full bg-brand-50 text-[10px] text-brand-600">
								1
							</span>
							{t("attendance_step_group")}
						</span>
						<div className="flex flex-wrap gap-2">
							{[...groupIdsWithSessions]
								.sort((a, b) =>
									(groupsMap[a] || "").localeCompare(groupsMap[b] || ""),
								)
								.map((gid) => (
									<button
										key={gid}
										type="button"
										onClick={() => handleSelectGroup(gid)}
										className={cn(
											"inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-all",
											selectedGroupId === gid
												? "border-brand-500 bg-brand-500 text-white shadow-sm"
												: "border-line bg-surface-50 text-ink-700 hover:border-brand-300 hover:bg-white",
										)}
									>
										<Users size={14} />
										{groupsMap[gid] || t("students_no_group")}
									</button>
								))}
						</div>
					</div>
				)}

				{/* Étape 2 — la séance du groupe (cartes, séance du jour en tête). */}
				<div className="space-y-2">
					<span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-400">
						<span className="grid h-5 w-5 place-items-center rounded-full bg-brand-50 text-[10px] text-brand-600">
							{groupIdsWithSessions.length > 1 ? 2 : 1}
						</span>
						{t("attendance_step_session")}
					</span>
					{sessionsForGroup.length === 0 ? (
						<p className="py-2 text-sm text-ink-400">
							{t("attendance_choose_session")}
						</p>
					) : (
						<div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pe-1 sm:grid-cols-3 lg:grid-cols-4">
							{sessionsForGroup.map((s) => {
								const today = isSameLocalDay(new Date(s.startTime), new Date());
								const active = selectedSessionId === s.id;
								return (
									<button
										key={s.id}
										type="button"
										onClick={() => setSelectedSessionId(s.id)}
										className={cn(
											"flex flex-col items-start rounded-xl border p-3 text-start transition-all",
											active
												? "border-brand-500 bg-brand-500 text-white shadow-sm"
												: "border-line bg-surface-50 hover:border-brand-300 hover:bg-white",
										)}
									>
										<span
											className={cn(
												"text-[10px] font-bold uppercase tracking-wider",
												active
													? "text-white/80"
													: today
														? "text-brand-600"
														: "text-ink-400",
											)}
										>
											{today
												? `★ ${t("today_label")}`
												: formatDate(s.startTime, locale)}
										</span>
										<span className="mt-1 flex items-center gap-1.5 text-base font-black tabular-nums">
											<Clock
												size={14}
												className={active ? "text-white/80" : "text-brand-500"}
											/>
											{formatTime(s.startTime, locale)}
										</span>
									</button>
								);
							})}
						</div>
					)}
				</div>
			</Card>

			{/* Live summary — the gérant sees the appel at a glance */}
			{hasStudents && (
				<Card className="flex flex-wrap items-center gap-x-8 gap-y-3">
					<Counter tone="present" label={t("present")} value={counts.present} />
					<Counter tone="late" label={t("late")} value={counts.late} />
					<Counter tone="absent" label={t("absent")} value={counts.absent} />
					{counts.unmarked > 0 && (
						<span className="inline-flex items-center gap-2 rounded-full bg-surface-50 px-3 py-1 text-xs font-bold text-ink-500">
							<span className="h-2 w-2 rounded-full bg-ink-300" />
							{counts.unmarked} {t("attendance_unmarked")}
						</span>
					)}
					<div className="ms-auto flex items-center gap-2 text-xs font-semibold text-ink-400">
						<Users size={14} />
						{counts.total} {t("students_count_suffix")}
					</div>
				</Card>
			)}

			{/* Step 2 — the roster */}
			{!hasSession ? (
				<Card>
					<SectionEmpty
						icon={<CalendarPlus size={24} />}
						title="Aucune séance planifiée"
						hint="Créez une séance dans le Planning pour pouvoir faire l'appel."
						action={
							<Link
								href="/dashboard/schedule"
								className="btn btn--primary btn--md"
							>
								Ouvrir le Planning
							</Link>
						}
					/>
				</Card>
			) : !hasStudents ? (
				<Card>
					<SectionEmpty
						icon={<UserPlus size={24} />}
						title={`Le groupe « ${groupName || "—"} » n'a aucun élève`}
						hint="Inscrivez des élèves à ce groupe pour les pointer ici."
						action={
							<Link
								href="/dashboard/groups"
								className="btn btn--primary btn--md"
							>
								Gérer les groupes
							</Link>
						}
					/>
				</Card>
			) : (
				<Card pad={false} className="overflow-hidden">
					{/* Desktop table */}
					<div className="hidden md:block">
						<table className="w-full text-left">
							<thead className="border-b border-line/60 bg-surface-50">
								<tr>
									<th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-ink-400">
										{t("student")}
									</th>
									<th className="px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-ink-400">
										{t("status_header")}
									</th>
									<th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-ink-400">
										{t("note")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line/50">
								{studentsInGroup.map((student) => (
									<StudentRow
										key={student.id}
										student={student}
										status={statusOf(student.id)}
										note={currentAttendanceMap[student.id]?.note || ""}
										onStatusChange={handleStatusChange}
										onNoteChange={handleNoteChange}
										absenceUrl={absenceUrlFor(student)}
										t={t}
									/>
								))}
							</tbody>
						</table>
					</div>

					{/* Mobile list */}
					<div className="divide-y divide-line/50 md:hidden">
						{studentsInGroup.map((student) => (
							<StudentCard
								key={student.id}
								student={student}
								status={statusOf(student.id)}
								note={currentAttendanceMap[student.id]?.note || ""}
								onStatusChange={handleStatusChange}
								onNoteChange={handleNoteChange}
								absenceUrl={absenceUrlFor(student)}
								t={t}
							/>
						))}
					</div>
				</Card>
			)}

			{/* Mobile sticky save bar */}
			{hasStudents && (
				<div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line/60 bg-surface-white/95 p-4 backdrop-blur md:hidden">
					<Button
						variant="secondary"
						onClick={handleBulkMarkAllPresent}
						className="flex-1"
						icon={<UserCheck size={18} />}
					>
						{t("mark_all_present")}
					</Button>
					<Button
						variant="primary"
						onClick={handleSave}
						disabled={saving || !dirty}
						className="flex-1"
						icon={<Save size={18} />}
					>
						{saving ? t("saving") : t("save")}
					</Button>
				</div>
			)}
		</div>
	);
}

function Counter({
	tone,
	label,
	value,
}: {
	tone: StatusVariant;
	label: string;
	value: number;
}) {
	const meta = STATUS_META[tone];
	return (
		<div className="flex items-center gap-2.5">
			<span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
			<span className="text-2xl font-extrabold tabular-nums text-ink-900">
				{value}
			</span>
			<span className="text-xs font-bold uppercase tracking-widest text-ink-400">
				{label}
			</span>
		</div>
	);
}

function StatusPill({ status, t }: { status: StatutPresence; t: Translator }) {
	const variant = VARIANT_FOR_STATUS[status];
	const meta = STATUS_META[variant];
	const label =
		variant === "present"
			? t("present")
			: variant === "late"
				? t("late")
				: t("absent");
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
				meta.pill,
			)}
		>
			<span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
			{label}
		</span>
	);
}

function StudentIdentity({
	student,
	status,
	t,
}: {
	student: Student;
	status: StatutPresence | null;
	t: Translator;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line/60 bg-brand-50 text-sm font-bold text-brand-600">
				{student.firstName[0]}
				{student.lastName[0]}
			</div>
			<div className="min-w-0">
				<div className="flex items-center gap-2">
					<span className="truncate font-bold text-ink-900">
						{formatFullName(student.firstName, student.lastName)}
					</span>
					{status && (
						<span className="md:hidden">
							<StatusPill status={status} t={t} />
						</span>
					)}
				</div>
				<div className="truncate text-xs text-ink-500">
					{student.email || t("no_email")}
				</div>
			</div>
		</div>
	);
}

function AbsenceWhatsAppLink({
	url,
	t,
	className,
}: {
	url: string;
	t: Translator;
	className?: string;
}) {
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			title={t("attendance_notify_parent")}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 border border-emerald-200/60",
				className,
			)}
		>
			<MessageCircle size={13} />
			{t("attendance_notify_parent")}
		</a>
	);
}

function StudentRow({
	student,
	status,
	note,
	onStatusChange,
	onNoteChange,
	absenceUrl,
	t,
}: StudentRowProps) {
	return (
		<tr className="transition-colors hover:bg-surface-50/60">
			<td className="px-6 py-3">
				<StudentIdentity student={student} status={status} t={t} />
			</td>
			<td className="px-6 py-3">
				<StatusButtons
					status={status}
					onStatusChange={(s) => onStatusChange(student.id, s)}
					t={t}
				/>
			</td>
			<td className="px-6 py-3">
				<div className="flex items-center gap-2">
					<input
						type="text"
						placeholder={t("add_note")}
						value={note}
						onChange={(e) => onNoteChange(student.id, e.target.value)}
						className="w-full rounded-lg border border-line/60 bg-surface-50 px-3 py-2 text-xs text-ink-900 transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
					/>
					{absenceUrl && <AbsenceWhatsAppLink url={absenceUrl} t={t} />}
				</div>
			</td>
		</tr>
	);
}

function StudentCard({
	student,
	status,
	note,
	onStatusChange,
	onNoteChange,
	absenceUrl,
	t,
}: StudentRowProps) {
	return (
		<div className="space-y-4 p-4">
			<StudentIdentity student={student} status={status} t={t} />
			<div className="space-y-3">
				<StatusButtons
					status={status}
					onStatusChange={(s) => onStatusChange(student.id, s)}
					t={t}
					fullWidth
				/>
				<input
					type="text"
					placeholder={t("add_note")}
					value={note}
					onChange={(e) => onNoteChange(student.id, e.target.value)}
					className="w-full rounded-lg border border-line/60 bg-surface-50 px-4 py-2.5 text-xs text-ink-900 transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
				/>
				{absenceUrl && (
					<AbsenceWhatsAppLink
						url={absenceUrl}
						t={t}
						className="w-full justify-center"
					/>
				)}
			</div>
		</div>
	);
}

function StatusButtons({
	status,
	onStatusChange,
	t,
	fullWidth,
}: {
	status: StatutPresence | null;
	onStatusChange: (status: StatutPresence) => void;
	t: Translator;
	fullWidth?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-2",
				fullWidth ? "justify-between" : "justify-center",
			)}
		>
			<StatusButton
				active={status === StatutPresence.PRESENT}
				onClick={() => onStatusChange(StatutPresence.PRESENT)}
				variant="present"
				icon={<Check size={16} />}
				label={t("present")}
				fullWidth={fullWidth}
			/>
			<StatusButton
				active={status === StatutPresence.RETARD}
				onClick={() => onStatusChange(StatutPresence.RETARD)}
				variant="late"
				icon={<Clock size={16} />}
				label={t("late")}
				fullWidth={fullWidth}
			/>
			<StatusButton
				active={status === StatutPresence.ABSENT}
				onClick={() => onStatusChange(StatutPresence.ABSENT)}
				variant="absent"
				icon={<X size={16} />}
				label={t("absent")}
				fullWidth={fullWidth}
			/>
		</div>
	);
}

function StatusButton({
	active,
	onClick,
	variant,
	icon,
	label,
	fullWidth,
}: StatusButtonProps) {
	const meta = STATUS_META[variant];
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			aria-label={label}
			className={cn(
				"flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-all",
				fullWidth && "flex-1",
				active ? meta.active : meta.idle,
			)}
		>
			{icon}
			<span>{label}</span>
		</button>
	);
}
