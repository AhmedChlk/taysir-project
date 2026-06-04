"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
	AlertTriangle,
	Clock,
	MapPin,
	RefreshCw,
	Trash2,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	deleteSeriesAction,
	deleteSessionAction,
	updateSeriesAction,
	updateSessionAction,
} from "@/actions/schedule.actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatFullName } from "@/utils/format";

interface SessionDetailsProps {
	session: any;
	onSuccess: () => void;
}

export default function SessionDetails({
	session,
	onSuccess,
}: SessionDetailsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const [deleteMode, setDeleteMode] = useState<"single" | "following" | "all">(
		"single",
	);
	const [isEditing, setIsEditing] = useState(false);
	const [editMode, setEditMode] = useState<"single" | "following" | "all">(
		"single",
	);

	const handleDelete = () => {
		startTransition(async () => {
			let result;
			if (
				(deleteMode === "following" || deleteMode === "all") &&
				session.recurrenceGroupId
			) {
				result = await deleteSeriesAction({
					recurrenceGroupId: session.recurrenceGroupId,
					mode: deleteMode === "following" ? "FOLLOWING" : "ALL",
					currentSessionId: session.id,
				});
			} else {
				result = await deleteSessionAction({ id: session.id });
			}

			if (result.success) {
				router.refresh();
				onSuccess();
			}
		});
	};

	const handleUpdate = () => {
		startTransition(async () => {
			let result;
			if (
				(editMode === "following" || editMode === "all") &&
				session.recurrenceGroupId
			) {
				result = await updateSeriesAction({
					recurrenceGroupId: session.recurrenceGroupId,
					mode: editMode === "following" ? "FOLLOWING" : "ALL",
					currentSessionId: session.id,
					// Ici on pourrait passer les nouvelles valeurs si on avait un formulaire d'édition
					// Pour l'instant, on synchronise les métadonnées (room, activity, etc.)
					roomId: session.roomId,
					activityId: session.activityId,
					groupId: session.groupId,
					instructorId: session.instructorId,
				});
			} else {
				result = await updateSessionAction({
					id: session.id,
					// Idem ici
				});
			}

			if (result.success) {
				router.refresh();
				setIsEditing(false);
			}
		});
	};

	return (
		<div className="space-y-8">
			<div className="p-6 rounded-[32px] bg-white border border-taysir-teal/5 shadow-sm">
				<div className="flex justify-between items-start mb-6">
					<div className="flex items-center gap-4">
						<div
							className="w-4 h-12 rounded-full"
							style={{ backgroundColor: session.activity.color || "#0F515C" }}
						/>
						<div>
							<h3 className="text-2xl font-black text-taysir-teal uppercase tracking-tighter">
								{session.activity.name}
							</h3>
							<p className="text-xs font-bold text-taysir-teal/40 uppercase tracking-widest">
								{session.group.name}
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsEditing(!isEditing)}
						className="p-2 hover:bg-taysir-teal/5 rounded-xl transition-colors text-taysir-teal/40 hover:text-taysir-teal"
					>
						{isEditing ? "Annuler" : "Modifier"}
					</button>
				</div>

				{isEditing ? (
					<div className="p-4 bg-taysir-bg/50 rounded-2xl border border-taysir-teal/5 space-y-4">
						<p className="text-[10px] font-black uppercase text-taysir-teal/40">
							Mode de modification
						</p>
						<div className="grid grid-cols-1 gap-2">
							<button
								onClick={() => setEditMode("single")}
								className={`p-3 rounded-xl border-2 text-left transition-all ${
									editMode === "single"
										? "border-taysir-teal bg-white text-taysir-teal shadow-md"
										: "border-taysir-teal/10 text-taysir-teal/40"
								}`}
							>
								<p className="font-bold uppercase text-[10px]">
									Cette séance uniquement
								</p>
							</button>
							{session.recurrenceGroupId && (
								<div className="grid grid-cols-1 gap-2">
									<button
										onClick={() => setEditMode("following")}
										className={`p-3 rounded-xl border-2 text-left transition-all ${
											editMode === "following"
												? "border-taysir-teal bg-white text-taysir-teal shadow-md"
												: "border-taysir-teal/10 text-taysir-teal/40"
										}`}
									>
										<p className="font-bold uppercase text-[10px]">
											Celle-ci et les suivantes
										</p>
									</button>
									<button
										onClick={() => setEditMode("all")}
										className={`p-3 rounded-xl border-2 text-left transition-all ${
											editMode === "all"
												? "border-taysir-teal bg-white text-taysir-teal shadow-md"
												: "border-taysir-teal/10 text-taysir-teal/40"
										}`}
									>
										<p className="font-bold uppercase text-[10px]">
											Toute la série
										</p>
									</button>
								</div>
							)}
						</div>
						<p className="text-[10px] italic text-taysir-teal/60">
							Note: Le Drag & Drop sur l&apos;agenda modifie uniquement la
							séance déplacée.
						</p>
						<SubmitButton
							onClick={handleUpdate}
							isLoading={isPending}
							loadingText="Mise à jour..."
						>
							Confirmer la modification
						</SubmitButton>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4">
						{/* ... same details as before ... */}
						<div className="flex items-center gap-3 text-taysir-teal">
							<div className="p-2 bg-taysir-teal/5 rounded-xl">
								<Clock size={18} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase opacity-40">
									Horaire
								</p>
								<p className="font-bold">
									{format(new Date(session.startTime), "EEEE d MMMM", {
										locale: fr,
									})}
								</p>
								<p className="text-sm font-medium">
									{format(new Date(session.startTime), "HH:mm")} -{" "}
									{format(new Date(session.endTime), "HH:mm")}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3 text-taysir-teal">
							<div className="p-2 bg-taysir-teal/5 rounded-xl">
								<MapPin size={18} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase opacity-40">
									Localisation
								</p>
								<p className="font-bold">{session.room.name}</p>
							</div>
						</div>

						<div className="flex items-center gap-3 text-taysir-teal">
							<div className="p-2 bg-taysir-teal/5 rounded-xl">
								<User size={18} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase opacity-40">
									Intervenant
								</p>
								<p className="font-bold">
									{formatFullName(
										session.instructor.firstName,
										session.instructor.lastName,
									)}
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{session.recurrenceGroupId && (
				<div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-700 text-sm font-medium">
					<RefreshCw size={18} className="shrink-0 mt-0.5 animate-spin-slow" />
					<p>Cette séance fait partie d&apos;une série récurrente.</p>
				</div>
			)}

			<div className="space-y-3">
				{!showConfirmDelete ? (
					<button
						onClick={() => setShowConfirmDelete(true)}
						className="w-full py-4 rounded-2xl border-2 border-rose-100 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
					>
						<Trash2 size={16} /> Supprimer la séance
					</button>
				) : (
					<div className="space-y-4 p-6 bg-rose-50 rounded-[32px] border border-rose-100">
						<div className="flex items-center gap-3 text-rose-600 mb-2">
							<AlertTriangle size={20} />
							<p className="font-black uppercase tracking-tighter">
								Confirmation
							</p>
						</div>

						{session.recurrenceGroupId ? (
							<div className="grid grid-cols-1 gap-2">
								<button
									onClick={() => setDeleteMode("single")}
									className={`p-4 rounded-2xl border-2 text-left transition-all ${
										deleteMode === "single"
											? "border-rose-500 bg-white text-rose-600 shadow-md"
											: "border-rose-100 text-rose-300"
									}`}
								>
									<p className="font-bold uppercase text-[10px]">
										Uniquement cette séance
									</p>
								</button>
								<button
									onClick={() => setDeleteMode("following")}
									className={`p-4 rounded-2xl border-2 text-left transition-all ${
										deleteMode === "following"
											? "border-rose-500 bg-white text-rose-600 shadow-md"
											: "border-rose-100 text-rose-300"
									}`}
								>
									<p className="font-bold uppercase text-[10px]">
										Celle-ci et les suivantes
									</p>
								</button>
								<button
									onClick={() => setDeleteMode("all")}
									className={`p-4 rounded-2xl border-2 text-left transition-all ${
										deleteMode === "all"
											? "border-rose-500 bg-white text-rose-600 shadow-md"
											: "border-rose-100 text-rose-300"
									}`}
								>
									<p className="font-bold uppercase text-[10px]">
										Toutes les séances (Série complète)
									</p>
								</button>
							</div>
						) : (
							<p className="text-sm text-rose-600/70 font-medium">
								Êtes-vous sûr de vouloir supprimer cette séance ? Cette action
								est irréversible.
							</p>
						)}

						<div className="flex gap-2">
							<button
								onClick={() => setShowConfirmDelete(false)}
								className="flex-1 py-3 rounded-xl bg-white text-taysir-teal font-bold uppercase text-[10px]"
							>
								Annuler
							</button>
							<button
								onClick={handleDelete}
								disabled={isPending}
								className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold uppercase text-[10px] shadow-lg shadow-rose-500/20"
							>
								{isPending ? "Suppression..." : "Confirmer"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
