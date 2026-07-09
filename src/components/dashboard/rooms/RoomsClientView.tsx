"use client";

import {
	CalendarClock,
	DoorOpen,
	Loader2,
	MapPin,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
	createRoomAction,
	deleteRoomAction,
	updateRoomAction,
} from "@/actions/logistics.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import { Input, TextArea } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { Button, PageHeader, StatCard } from "@/components/ui/primitives";
import { useRouter } from "@/i18n/routing";
import { localizedRoom } from "@/lib/subjects";
import type { Room } from "@/types/schema";

/* A room carries its Planning usage (how many séances occupy it). */
type RoomWithUsage = Room & { _count: { sessions: number } };

interface RoomsClientViewProps {
	initialRooms: RoomWithUsage[];
}

export default function RoomsClientView({
	initialRooms = [],
}: RoomsClientViewProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [roomToDelete, setRoomToDelete] = useState<RoomWithUsage | null>(null);
	const [selectedRoom, setSelectedRoom] = useState<RoomWithUsage | null>(null);
	const [isPending, startTransition] = useTransition();
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();

	const metrics = useMemo(() => {
		const totalRooms = initialRooms.length;
		const totalCapacity = initialRooms.reduce((a, r) => a + r.capacity, 0);
		const totalSessions = initialRooms.reduce(
			(a, r) => a + r._count.sessions,
			0,
		);
		return { totalRooms, totalCapacity, totalSessions };
	}, [initialRooms]);

	const handleAction = (room: RoomWithUsage) => {
		setSelectedRoom(room);
		setIsModalOpen(true);
	};

	const handleDelete = (room: RoomWithUsage) => {
		setRoomToDelete(room);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!roomToDelete) return;
		startTransition(async () => {
			const result = await deleteRoomAction({ id: roomToDelete.id });
			if (result.success) {
				setIsDeleteModalOpen(false);
				setRoomToDelete(null);
				router.refresh();
			} else {
				alert(result.error.message);
			}
		});
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const data = {
			name: formData.get("name") as string,
			capacity: parseInt(formData.get("capacity") as string, 10),
			description: formData.get("description") as string,
		};

		startTransition(async () => {
			let result;
			if (selectedRoom) {
				result = await updateRoomAction({ id: selectedRoom.id, ...data });
			} else {
				result = await createRoomAction(data);
			}

			if (result.success) {
				setIsModalOpen(false);
				setSelectedRoom(null);
				router.refresh();
			} else {
				alert(result.error.message);
			}
		});
	};

	const columns = [
		{
			header: t("room_name"),
			accessor: (room: RoomWithUsage) => (
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 shadow-ts-1">
						<MapPin size={20} />
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-ink-900 text-sm">
							{localizedRoom(room.name, locale)}
						</span>
						<span className="text-xs font-medium text-ink-400">
							{t("capacity_places", { count: room.capacity })}
						</span>
					</div>
				</div>
			),
		},
		{
			header: t("capacity"),
			accessor: (room: RoomWithUsage) => (
				<div className="flex items-center gap-2 text-ink-700">
					<Users size={16} className="text-ink-400" />
					<span className="font-semibold tabular-nums">{room.capacity}</span>
				</div>
			),
		},
		{
			header: "Occupation",
			accessor: (room: RoomWithUsage) =>
				room._count.sessions > 0 ? (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
						<CalendarClock size={13} />
						{room._count.sessions} séance
						{room._count.sessions > 1 ? "s" : ""}
					</span>
				) : (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-bold text-ink-400">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Libre
					</span>
				),
		},
		{
			header: t("description"),
			accessor: (room: RoomWithUsage) => (
				<span className="block max-w-xs truncate text-sm text-ink-500">
					{room.description || "—"}
				</span>
			),
		},
		{
			header: t("actions"),
			accessor: (room: RoomWithUsage) => {
				const occupied = room._count.sessions > 0;
				return (
					<div className="flex items-center justify-end">
						<button
							type="button"
							disabled={occupied}
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(room);
							}}
							className={
								occupied
									? "inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl text-ink-300"
									: "inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-rose-50 hover:text-danger"
							}
							title={
								occupied
									? "Salle utilisée dans le planning — libérez-la d'abord"
									: t("delete")
							}
						>
							<Trash2 size={18} />
						</button>
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("rooms_title")}
				title="Gestion des"
				accent="Salles"
				subtitle={t("rooms_subtitle")}
				actions={
					<Button
						onClick={() => {
							setSelectedRoom(null);
							setIsModalOpen(true);
						}}
						icon={<Plus size={18} />}
					>
						{t("add_room")}
					</Button>
				}
			/>

			{/* KPIs — concordent avec Groupes/Présences */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label={t("rooms_total")}
					value={metrics.totalRooms}
					icon={<DoorOpen size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("rooms_total_capacity")}
					value={metrics.totalCapacity}
					icon={<Users size={20} />}
					tone="brand"
					hint={t("rooms_cumulative_places")}
				/>
				<StatCard
					label={t("rooms_scheduled_sessions")}
					value={metrics.totalSessions}
					icon={<CalendarClock size={20} />}
					tone="positive"
					hint={t("rooms_occupation")}
				/>
			</div>

			{/* Rooms Table */}
			<DataTable
				data={initialRooms}
				columns={columns}
				searchPlaceholder={t("search")}
				onAction={handleAction}
				hideDefaultAction={true}
			/>

			{/* Add/Edit Room Modal */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedRoom(null);
				}}
				title={selectedRoom ? t("edit_room") : t("add_room")}
				footer={
					<>
						<button
							type="button"
							disabled={isPending}
							onClick={() => setIsModalOpen(false)}
							className="btn btn--ghost btn--md"
						>
							{t("cancel")}
						</button>
						<button
							form="room-form"
							type="submit"
							disabled={isPending}
							className="btn btn--primary btn--md"
						>
							{isPending && <Loader2 size={16} className="animate-spin" />}
							{selectedRoom ? t("save_changes") : t("add")}
						</button>
					</>
				}
			>
				<form id="room-form" onSubmit={handleSubmit} className="space-y-4">
					<Input
						name="name"
						label={t("room_name")}
						defaultValue={selectedRoom?.name ?? undefined}
						placeholder="Ex: Salle A1"
						required
					/>
					<Input
						name="capacity"
						label={t("capacity")}
						type="number"
						defaultValue={selectedRoom?.capacity ?? undefined}
						placeholder="Ex: 20"
						required
					/>
					<TextArea
						name="description"
						label={t("description")}
						defaultValue={selectedRoom?.description ?? undefined}
						placeholder={t("description_placeholder")}
					/>
				</form>
			</Modal>

			<ConfirmModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
				title={t("confirm_delete")}
				message={t("confirm_delete_desc") || t("confirm_delete")}
				confirmLabel={t("delete")}
				variant="danger"
				isLoading={isPending}
			/>
		</div>
	);
}
