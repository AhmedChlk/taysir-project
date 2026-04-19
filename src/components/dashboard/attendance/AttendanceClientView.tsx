"use client";

import { StatutPresence } from "@prisma/client";
import { clsx } from "clsx";
import { Check, ChevronDown, Clock, Save, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { AttendanceRecord, Group, Session, Student } from "@/types/schema";
import { formatDate, formatFullName, formatTime } from "@/utils/format";

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
	const [selectedSessionId, setSelectedSessionId] = useState<string>(
		sessions[0]?.id || "",
	);
	const [attendance, setAttendance] =
		useState<AttendanceRecord[]>(initialAttendance);
	const t = useTranslations();
	const locale = useLocale();

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
		() => (sessions || []).find((s) => s.id === selectedSessionId),
		[selectedSessionId, sessions],
	);

	const studentsInGroup = useMemo(() => {
		if (!selectedSession?.groupId) return [];
		const groupId = selectedSession.groupId;
		return (students || []).filter((s) =>
			(s.groups || []).some((g) => g.id === groupId),
		);
	}, [selectedSession, students]);

	// Map for O(1) attendance lookup
	const attendanceMap = useMemo(() => {
		return (attendance || []).reduce(
			(acc, a) => {
				if (a.sessionId === selectedSessionId) {
					acc[a.studentId] = a;
				}
				return acc;
			},
			{} as Record<string, AttendanceRecord>,
		);
	}, [attendance, selectedSessionId]);

	const toggleStatus = (studentId: string, status: StatutPresence) => {
		setAttendance((prev) => {
			const existing = prev.find(
				(a) => a.studentId === studentId && a.sessionId === selectedSessionId,
			);
			if (existing) {
				return prev.map((a) =>
					a.studentId === studentId && a.sessionId === selectedSessionId
						? { ...a, status }
						: a,
				);
			} else {
				return [
					...prev,
					{
						id: `new-${Date.now()}`,
						etablissementId: selectedSession?.etablissementId || "",
						sessionId: selectedSessionId,
						studentId,
						status,
						note: null,
					},
				];
			}
		});
	};

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						{t("attendance")}
					</h1>
					<p className="text-sm text-gray-500">{t("attendance_subtitle")}</p>
				</div>
				<button
					type="button"
					onClick={() => alert(t("save_success"))}
					className="btn-primary flex items-center gap-2"
				>
					<Save size={20} />
					{t("save")}
				</button>
			</div>

			{/* Session Selector */}
			<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
				<label
					htmlFor="session-selector"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					{t("select_session")}
				</label>
				<div className="relative max-w-md">
					<select
						id="session-selector"
						value={selectedSessionId}
						onChange={(e) => setSelectedSessionId(e.target.value)}
						className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 p-3 pr-10 text-sm text-gray-900 focus:border-primary-teal focus:ring-primary-teal"
					>
						{(sessions || []).map((session) => (
							<option key={session.id} value={session.id}>
								{formatDate(session.startTime, locale)} -{" "}
								{formatTime(session.startTime, locale)} ({t("groups")}:{" "}
								{groupsMap[session.groupId || ""] || t("unknown")})
							</option>
						))}
					</select>
					<ChevronDown
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
						size={18}
					/>
				</div>
			</div>

			{/* Attendance Table */}
			<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<table className="w-full text-left text-sm rtl:text-right">
					<thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
						<tr>
							<th className="px-6 py-4">{t("total_students")}</th>
							<th className="px-6 py-4 text-center">{t("status_header")}</th>
							<th className="px-6 py-4">{t("description")}</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{studentsInGroup.map((student) => {
							const record = attendanceMap[student.id];
							const status = record?.status || StatutPresence.PRESENT;

							return (
								<tr
									key={student.id}
									className="hover:bg-gray-50 transition-colors"
								>
									<td className="px-6 py-4">
										<div className="font-medium text-gray-900">
											{formatFullName(student.firstName, student.lastName)}
										</div>
										<div className="text-xs text-gray-500">{student.email}</div>
									</td>
									<td className="px-6 py-4">
										<div className="flex items-center justify-center gap-2">
											<button
												type="button"
												onClick={() =>
													toggleStatus(student.id, StatutPresence.PRESENT)
												}
												className={clsx(
													"flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
													status === StatutPresence.PRESENT
														? "bg-green-100 border-green-500 text-green-600 ring-2 ring-green-500/20"
														: "bg-white border-gray-200 text-gray-400 hover:bg-gray-50",
												)}
												title={t("active")}
											>
												<Check size={20} />
											</button>
											<button
												type="button"
												onClick={() =>
													toggleStatus(student.id, StatutPresence.RETARD)
												}
												className={clsx(
													"flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
													status === StatutPresence.RETARD
														? "bg-orange-100 border-orange-500 text-orange-600 ring-2 ring-orange-500/20"
														: "bg-white border-gray-200 text-gray-400 hover:bg-gray-50",
												)}
												title={t("late")}
											>
												<Clock size={20} />
											</button>
											<button
												type="button"
												onClick={() =>
													toggleStatus(student.id, StatutPresence.ABSENT)
												}
												className={clsx(
													"flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
													status === StatutPresence.ABSENT
														? "bg-red-100 border-red-500 text-red-600 ring-2 ring-red-500/20"
														: "bg-white border-gray-200 text-gray-400 hover:bg-gray-50",
												)}
												title={t("inactive")}
											>
												<X size={20} />
											</button>
										</div>
									</td>
									<td className="px-6 py-4">
										<input
											type="text"
											placeholder={t("description_placeholder")}
											className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-1.5 text-xs text-gray-900 focus:border-primary-teal focus:outline-none focus:ring-1 focus:ring-primary-teal"
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
