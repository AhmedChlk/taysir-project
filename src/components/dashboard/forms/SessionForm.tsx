"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { createSessionAction } from "@/actions/schedule.actions";
import { Input, Select } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useRouter } from "@/i18n/routing";
import { localizedRoom, localizedSubject } from "@/lib/subjects";
import { formatFullName } from "@/utils/format";

type RoomOption = { id: string; name: string; capacity: number };
type ActivityOption = { id: string; name: string; color?: string | null };
type StaffOption = {
	id: string;
	role: string;
	firstName: string;
	lastName: string;
};
type GroupOption = { id: string; name: string };

interface SessionFormProps {
	onSuccess?: () => void;
	rooms?: RoomOption[];
	activities?: ActivityOption[];
	staff?: StaffOption[];
	groups?: GroupOption[];
}

export default function SessionForm({
	onSuccess,
	rooms = [],
	activities = [],
	staff = [],
	groups = [],
}: SessionFormProps) {
	const router = useRouter();
	const t = useTranslations();
	const locale = useLocale();
	const searchParams = useSearchParams();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const paramStart = searchParams.get("start");
	const paramEnd = searchParams.get("end");

	const initialDate = paramStart
		? new Date(paramStart).toISOString().split("T")[0]
		: new Date().toISOString().split("T")[0];

	const initialStartTime = paramStart
		? new Date(paramStart).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
		: "08:00";

	const initialEndTime = paramEnd
		? new Date(paramEnd).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
		: "10:00";

	const [formData, setFormData] = useState({
		activityId: "",
		roomId: "",
		instructorId: "",
		groupId: "",
		date: initialDate,
		startTime: initialStartTime,
		endTime: initialEndTime,
		recurrenceType: "NONE" as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
		recurrenceEnd: "",
	});

	const instructors = useMemo(
		() =>
			staff.filter(
				(u) =>
					u.role === "INTERVENANT" || u.role === "GERANT" || u.role === "ADMIN",
			),
		[staff],
	);

	const activityOptions = useMemo(
		() => [
			{ label: t("payments_select_activity"), value: "" },
			...activities.map((a) => ({
				label: localizedSubject(a.name, locale),
				value: a.id,
			})),
		],
		[activities, t, locale],
	);

	const roomOptions = useMemo(
		() => [
			{ label: t("session_select_room"), value: "" },
			...rooms.map((r) => ({
				label: `${localizedRoom(r.name, locale)} (${t("session_capacity_abbr")} ${r.capacity})`,
				value: r.id,
			})),
		],
		[rooms, t, locale],
	);

	const instructorOptions = useMemo(
		() => [
			{ label: t("session_select_teacher"), value: "" },
			...instructors.map((i) => ({
				label: formatFullName(i.firstName, i.lastName),
				value: i.id,
			})),
		],
		[instructors, t],
	);

	const groupOptions = useMemo(
		() => [
			{ label: t("session_select_group"), value: "" },
			...groups.map((g) => ({ label: g.name, value: g.id })),
		],
		[groups, t],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isPending) return;
		setError(null);

		const start = new Date(`${formData.date}T${formData.startTime}`);
		const end = new Date(`${formData.date}T${formData.endTime}`);

		if (end <= start) {
			setError(t("session_end_before_start_error"));
			return;
		}

		setIsPending(true);
		try {
			const result = await createSessionAction({
				activityId: formData.activityId,
				roomId: formData.roomId,
				instructorId: formData.instructorId,
				groupId: formData.groupId,
				startTime: start,
				endTime: end,
				recurrenceType: formData.recurrenceType,
				recurrenceEnd: formData.recurrenceEnd
					? new Date(formData.recurrenceEnd)
					: null,
			});

			if (result?.success) {
				router.refresh();
				if (onSuccess) onSuccess();
			} else {
				setError(result?.error?.message || t("error_occurred"));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : t("error_occurred"));
		} finally {
			setIsPending(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm font-medium"
					>
						<AlertCircle size={18} className="shrink-0 mt-0.5" />
						<p>{error}</p>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="grid grid-cols-1 gap-4">
				<Select
					label={t("payments_activity")}
					value={formData.activityId}
					onChange={(e) =>
						setFormData({ ...formData, activityId: e.target.value })
					}
					options={activityOptions}
					required
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Select
						label={t("session_room")}
						value={formData.roomId}
						onChange={(e) =>
							setFormData({ ...formData, roomId: e.target.value })
						}
						options={roomOptions}
						required
					/>
					<Select
						label={t("session_instructor")}
						value={formData.instructorId}
						onChange={(e) =>
							setFormData({ ...formData, instructorId: e.target.value })
						}
						options={instructorOptions}
						required
					/>
				</div>

				<Select
					label={t("session_student_group")}
					value={formData.groupId}
					onChange={(e) =>
						setFormData({ ...formData, groupId: e.target.value })
					}
					options={groupOptions}
					required
				/>

				<div className="h-px bg-brand-500/5 my-2" />

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Input
						label={t("session_date")}
						type="date"
						value={formData.date}
						onChange={(e) => setFormData({ ...formData, date: e.target.value })}
						required
					/>
					<Input
						label={t("session_start")}
						type="time"
						value={formData.startTime}
						onChange={(e) =>
							setFormData({ ...formData, startTime: e.target.value })
						}
						required
					/>
					<Input
						label={t("session_end")}
						type="time"
						value={formData.endTime}
						onChange={(e) =>
							setFormData({ ...formData, endTime: e.target.value })
						}
						required
					/>
				</div>

				<div className="h-px bg-brand-500/5 my-2" />

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Select
						label={t("session_recurrence")}
						value={formData.recurrenceType}
						onChange={(e) =>
							setFormData({
								...formData,
								recurrenceType: e.target.value as
									| "NONE"
									| "DAILY"
									| "WEEKLY"
									| "MONTHLY",
							})
						}
						options={[
							{ label: t("session_recurrence_none"), value: "NONE" },
							{ label: t("session_daily"), value: "DAILY" },
							{ label: t("session_weekly"), value: "WEEKLY" },
							{ label: t("session_monthly"), value: "MONTHLY" },
						]}
					/>
					{formData.recurrenceType !== "NONE" && (
						<Input
							label={t("session_recurrence_end")}
							type="date"
							value={formData.recurrenceEnd}
							onChange={(e) =>
								setFormData({ ...formData, recurrenceEnd: e.target.value })
							}
							required
						/>
					)}
				</div>
			</div>

			<div className="pt-4">
				<SubmitButton
					isLoading={isPending}
					loadingText={t("session_form_loading")}
				>
					<Calendar size={20} />
					<span>{t("session_confirm")}</span>
				</SubmitButton>
			</div>
		</form>
	);
}
