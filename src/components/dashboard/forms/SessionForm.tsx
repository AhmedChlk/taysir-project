"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { createSessionAction } from "@/actions/schedule.actions";
import { Input, Select } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatFullName } from "@/utils/format";

type RoomOption = { id: string; name: string; capacity: number };
type ActivityOption = { id: string; name: string; color?: string | null };
type StaffOption = { id: string; role: string; firstName: string; lastName: string };
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
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const initialDate = searchParams.get("date")
		? new Date(searchParams.get("date")!).toISOString().split("T")[0]
		: new Date().toISOString().split("T")[0];

	const [formData, setFormData] = useState({
		activityId: "",
		roomId: "",
		instructorId: "",
		groupId: "",
		date: initialDate,
		startTime: "08:00",
		endTime: "10:00",
	});

	const instructors = staff.filter(
		(u) =>
			u.role === "INTERVENANT" || u.role === "GERANT" || u.role === "ADMIN",
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const start = new Date(`${formData.date}T${formData.startTime}`);
		const end = new Date(`${formData.date}T${formData.endTime}`);

		if (end <= start) {
			setError("L'heure de fin doit être après l'heure de début.");
			return;
		}

		startTransition(async () => {
			const result = await createSessionAction({
				activityId: formData.activityId,
				roomId: formData.roomId,
				instructorId: formData.instructorId,
				groupId: formData.groupId,
				startTime: start,
				endTime: end,
			});

			if (result.success) {
				router.refresh();
				if (onSuccess) onSuccess();
			} else {
				setError(result.error.message);
			}
		});
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
					label="Activité"
					value={formData.activityId}
					onChange={(e) =>
						setFormData({ ...formData, activityId: e.target.value })
					}
					options={[
						{ label: "Sélectionner une activité...", value: "" },
						...activities.map((a) => ({ label: a.name, value: a.id })),
					]}
					required
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Select
						label="Salle"
						value={formData.roomId}
						onChange={(e) =>
							setFormData({ ...formData, roomId: e.target.value })
						}
						options={[
							{ label: "Choisir une salle...", value: "" },
							...rooms.map((r) => ({
								label: `${r.name} (Cap. ${r.capacity})`,
								value: r.id,
							})),
						]}
						required
					/>
					<Select
						label="Intervenant"
						value={formData.instructorId}
						onChange={(e) =>
							setFormData({ ...formData, instructorId: e.target.value })
						}
						options={[
							{ label: "Choisir un intervenant...", value: "" },
							...instructors.map((i) => ({
								label: formatFullName(i.firstName, i.lastName),
								value: i.id,
							})),
						]}
						required
					/>
				</div>

				<Select
					label="Groupe d'élèves"
					value={formData.groupId}
					onChange={(e) =>
						setFormData({ ...formData, groupId: e.target.value })
					}
					options={[
						{ label: "Choisir un groupe...", value: "" },
						...groups.map((g) => ({ label: g.name, value: g.id })),
					]}
					required
				/>

				<div className="h-px bg-taysir-teal/5 my-2" />

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Input
						label="Date"
						type="date"
						value={formData.date}
						onChange={(e) => setFormData({ ...formData, date: e.target.value })}
						required
					/>
					<Input
						label="Début"
						type="time"
						value={formData.startTime}
						onChange={(e) =>
							setFormData({ ...formData, startTime: e.target.value })
						}
						required
					/>
					<Input
						label="Fin"
						type="time"
						value={formData.endTime}
						onChange={(e) =>
							setFormData({ ...formData, endTime: e.target.value })
						}
						required
					/>
				</div>
			</div>

			<div className="pt-4">
				<SubmitButton
					isLoading={isPending}
					loadingText="Planification en cours..."
				>
					<Calendar size={20} />
					<span>Confirmer la séance</span>
				</SubmitButton>
			</div>
		</form>
	);
}
