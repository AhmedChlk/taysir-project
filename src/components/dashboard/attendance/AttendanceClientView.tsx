"use client";

import { StatutPresence } from "@prisma/client";
import {
	Check,
	ChevronDown,
	Clock,
	Save,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useMemo, useState, useTransition } from "react";
import { bulkMarkPresenceAction } from "@/actions/logistics.actions";
import type { AttendanceRecord, Group, Session, Student } from "@/types/schema";
import { cn, formatDate, formatFullName, formatTime } from "@/utils/format";

interface AttendanceClientViewProps {
	sessions: Session[];
	students: Student[];
	groups: Group[];
	initialAttendance: AttendanceRecord[];
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

	const [selectedSessionId, setSelectedSessionId] = useState<string>(
		sessions[0]?.id || "",
	);
	const [attendanceState, setAttendanceState] =
		useState<AttendanceRecord[]>(initialAttendance);

	// Safe Action hook
	const { execute: executeBulkSave, status } = useAction(
		bulkMarkPresenceAction as any,
		{
			onSuccess: () => {
				alert(t("save_success"));
			},
			onError: () => {
				alert(t("error_occurred"));
			},
		},
	);

	const groupsMap = useMemo(() => {
		return (groups || []).reduce(
			(acc, g) => {
				acc[g.id] = g.name;
				return acc;
			},
			{} as Record<string, string>,
		);
	}, [groups]);

	const selectedSession = useMemo(
		() => sessions.find((s) => s.id === selectedSessionId),
		[selectedSessionId, sessions],
	);

	const studentsInGroup = useMemo(() => {
		if (!selectedSession?.groupId) return [];
		const gid = selectedSession.groupId;
		return students.filter((s) => (s.groups || []).some((g) => g.id === gid));
	}, [selectedSession, students]);

	const currentAttendanceMap = useMemo(() => {
		return attendanceState.reduce(
			(acc, a) => {
				if (a.sessionId === selectedSessionId) {
					acc[a.studentId] = a;
				}
				return acc;
			},
			{} as Record<string, AttendanceRecord>,
		);
	}, [attendanceState, selectedSessionId]);

	const handleStatusChange = useCallback(
		(studentId: string, status: StatutPresence) => {
			setAttendanceState((prev) => {
				const existing = prev.find(
					(a) => a.studentId === studentId && a.sessionId === selectedSessionId,
				);
				if (existing) {
					return prev.map((a) =>
						a.studentId === studentId && a.sessionId === selectedSessionId
							? { ...a, status }
							: a,
					);
				}
				return [
					...prev,
					{
						id: `temp-${Date.now()}`,
						sessionId: selectedSessionId,
						studentId,
						status,
						note: null,
						etablissementId: selectedSession?.etablissementId || "",
					} as AttendanceRecord,
				];
			});
		},
		[selectedSessionId, selectedSession?.etablissementId],
	);

	const handleBulkMarkAllPresent = () => {
		const _newRecords = studentsInGroup.map((student) => ({
			studentId: student.id,
			status: StatutPresence.PRESENT,
			note: currentAttendanceMap[student.id]?.note || null,
		}));

		// Update local state first (Optimistic)
		setAttendanceState((prev) => {
			const otherSessions = prev.filter(
				(a) => a.sessionId !== selectedSessionId,
			);
			const updatedRecords = studentsInGroup.map(
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
			return [...otherSessions, ...updatedRecords];
		});
	};

	const handleSave = () => {
		const sessionRecords = studentsInGroup.map((student) => {
			const record = currentAttendanceMap[student.id];
			return {
				studentId: student.id,
				status: record?.status || StatutPresence.PRESENT,
				note: record?.note || null,
			};
		});

		startTransition(() => {
			executeBulkSave({
				sessionId: selectedSessionId,
				records: sessionRecords,
			});
		});
	};

	return (
		<div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-0">
			{/* Header with quick stats */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
						<Users className="text-primary-teal" />
						{t("attendance")}
					</h1>
					<p className="text-sm text-gray-500">
						{selectedSession ? (
							<>
								{formatDate(selectedSession.startTime, locale)} •{" "}
								{formatTime(selectedSession.startTime, locale)} •{" "}
								{groupsMap[selectedSession.groupId || ""]}
							</>
						) : (
							t("select_session")
						)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={handleBulkMarkAllPresent}
						className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-teal bg-primary-teal/10 rounded-lg hover:bg-primary-teal/20 transition-colors"
					>
						<UserCheck size={18} />
						{t("mark_all_present")}
					</button>
					<button
						onClick={handleSave}
						disabled={isPending || status === "executing"}
						className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-teal text-white rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 shadow-sm transition-all"
					>
						<Save size={20} />
						{isPending ? t("saving") : t("save")}
					</button>
				</div>
			</div>

			{/* Sticky Session Selector for Mobile */}
			<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
				<label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
					{t("select_session")}
				</label>
				<div className="relative">
					<select
						value={selectedSessionId}
						onChange={(e) => setSelectedSessionId(e.target.value)}
						className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-primary-teal/20 focus:border-primary-teal transition-all text-sm"
					>
						{sessions.map((s) => (
							<option key={s.id} value={s.id}>
								{formatDate(s.startTime, locale)} -{" "}
								{formatTime(s.startTime, locale)} ({groupsMap[s.groupId || ""]})
							</option>
						))}
					</select>
					<ChevronDown
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
						size={20}
					/>
				</div>
			</div>

			{/* Mobile Optimized List / Desktop Table */}
			<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
				<div className="hidden md:block">
					<table className="w-full text-left">
						<thead className="bg-gray-50 border-b border-gray-100">
							<tr>
								<th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
									{t("student")}
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
									{t("status_header")}
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
									{t("note")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{studentsInGroup.map((student) => (
								<StudentRow
									key={student.id}
									student={student}
									record={currentAttendanceMap[student.id]}
									onStatusChange={handleStatusChange}
									t={t}
								/>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile List View */}
				<div className="md:hidden divide-y divide-gray-100">
					{studentsInGroup.map((student) => (
						<StudentCard
							key={student.id}
							student={student}
							record={currentAttendanceMap[student.id]}
							onStatusChange={handleStatusChange}
							t={t}
						/>
					))}
				</div>
			</div>

			{/* Mobile Floating Action Button for Bulk */}
			<button
				onClick={handleBulkMarkAllPresent}
				className="md:hidden fixed bottom-6 right-6 p-4 bg-primary-teal text-white rounded-full shadow-lg z-50 hover:scale-105 active:scale-95 transition-all"
			>
				<UserCheck size={24} />
			</button>
		</div>
	);
}

function StudentRow({ student, record, onStatusChange, t }: any) {
	const status = record?.status || StatutPresence.PRESENT;

	return (
		<tr className="hover:bg-gray-50/50 transition-colors">
			<td className="px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-primary-teal/5 flex items-center justify-center text-primary-teal font-bold border border-primary-teal/10">
						{student.firstName[0]}
						{student.lastName[0]}
					</div>
					<div>
						<div className="font-semibold text-gray-900">
							{formatFullName(student.firstName, student.lastName)}
						</div>
						<div className="text-xs text-gray-500">
							{student.email || t("no_email")}
						</div>
					</div>
				</div>
			</td>
			<td className="px-6 py-4">
				<StatusButtons
					status={status}
					onStatusChange={(s: any) => onStatusChange(student.id, s)}
					t={t}
				/>
			</td>
			<td className="px-6 py-4">
				<input
					type="text"
					placeholder={t("add_note")}
					value={record?.note || ""}
					onChange={(_e) => {
						/* Handle note change */
					}}
					className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary-teal/20 transition-all"
				/>
			</td>
		</tr>
	);
}

function StudentCard({ student, record, onStatusChange, t }: any) {
	const status = record?.status || StatutPresence.PRESENT;

	return (
		<div className="p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-primary-teal/5 flex items-center justify-center text-primary-teal font-bold border border-primary-teal/10 text-sm">
						{student.firstName[0]}
						{student.lastName[0]}
					</div>
					<div>
						<div className="font-semibold text-gray-900">
							{formatFullName(student.firstName, student.lastName)}
						</div>
						<div className="text-[10px] text-gray-400 uppercase tracking-tight">
							{student.email || t("no_email")}
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-3">
				<StatusButtons
					status={status}
					onStatusChange={(s: any) => onStatusChange(student.id, s)}
					t={t}
					isFullWidth
				/>
				<input
					type="text"
					placeholder={t("add_note")}
					value={record?.note || ""}
					onChange={(_e) => {
						/* Handle note change */
					}}
					className="w-full bg-gray-50 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-teal/20 transition-all"
				/>
			</div>
		</div>
	);
}

function StatusButtons({ status, onStatusChange, t, isFullWidth }: any) {
	return (
		<div
			className={cn(
				"flex items-center gap-2",
				isFullWidth ? "justify-between" : "justify-center",
			)}
		>
			<StatusButton
				active={status === StatutPresence.PRESENT}
				onClick={() => onStatusChange(StatutPresence.PRESENT)}
				variant="present"
				icon={<Check size={20} />}
				label={t("present")}
				showLabel={isFullWidth}
			/>
			<StatusButton
				active={status === StatutPresence.RETARD}
				onClick={() => onStatusChange(StatutPresence.RETARD)}
				variant="late"
				icon={<Clock size={20} />}
				label={t("late")}
				showLabel={isFullWidth}
			/>
			<StatusButton
				active={status === StatutPresence.ABSENT}
				onClick={() => onStatusChange(StatutPresence.ABSENT)}
				variant="absent"
				icon={<X size={20} />}
				label={t("absent")}
				showLabel={isFullWidth}
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
	showLabel,
}: any) {
	const variants = {
		present: active
			? "bg-green-500 text-white shadow-lg shadow-green-200"
			: "bg-white text-gray-400 border-gray-200 hover:border-green-200 hover:text-green-500",
		late: active
			? "bg-amber-500 text-white shadow-lg shadow-amber-200"
			: "bg-white text-gray-400 border-gray-200 hover:border-amber-200 hover:text-amber-500",
		absent: active
			? "bg-red-500 text-white shadow-lg shadow-red-200"
			: "bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-500",
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center justify-center gap-2 transition-all rounded-xl border",
				showLabel ? "flex-1 py-2.5 px-3" : "h-11 w-11",
				variants[variant as keyof typeof variants],
			)}
		>
			{icon}
			{showLabel && <span className="text-xs font-bold">{label}</span>}
		</button>
	);
}
