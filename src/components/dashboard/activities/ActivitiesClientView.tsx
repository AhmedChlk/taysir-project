"use client";

import { BookOpen, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
	createActivityAction,
	deleteActivityAction,
	updateActivityAction,
} from "@/actions/logistics.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import { Input, TextArea } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { useRouter } from "@/i18n/routing";
import type { Activity } from "@/types/schema";

interface ActivitiesClientViewProps {
	initialActivities: Activity[];
}

export default function ActivitiesClientView({
	initialActivities = [],
}: ActivitiesClientViewProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
	const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
		null,
	);
	const [isPending, startTransition] = useTransition();
	const t = useTranslations();
	const router = useRouter();

	const handleAction = (activity: Activity) => {
		setSelectedActivity(activity);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string) => {
		setActivityToDelete(id);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!activityToDelete) return;
		startTransition(async () => {
			const result = await deleteActivityAction({ id: activityToDelete });
			if (result.success) {
				setIsDeleteModalOpen(false);
				setActivityToDelete(null);
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
			duration: parseInt(formData.get("duration") as string, 10),
			description: formData.get("description") as string,
			color: formData.get("color") as string,
		};

		startTransition(async () => {
			let result;
			if (selectedActivity) {
				result = await updateActivityAction({
					id: selectedActivity.id,
					...data,
				});
			} else {
				result = await createActivityAction(data);
			}

			if (result.success) {
				setIsModalOpen(false);
				setSelectedActivity(null);
				router.refresh();
			} else {
				alert(result.error.message);
			}
		});
	};

	const columns = [
		{
			header: t("activity_name"),
			accessor: (activity: Activity) => (
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-teal/10 text-primary-teal">
						<BookOpen size={20} />
					</div>
					<span className="font-medium text-gray-900">{activity.name}</span>
				</div>
			),
		},
		{
			header: t("default_duration"),
			accessor: (activity: Activity) => (
				<div className="flex items-center gap-2 text-gray-600">
					<Clock size={16} className="text-gray-400" />
					<span>{t("duration_mins", { count: activity.duration ?? 0 })}</span>
				</div>
			),
		},
		{
			header: t("label_color"),
			accessor: (activity: Activity) => (
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<div
							className="h-4 w-4 rounded-full border border-gray-200"
							style={{ backgroundColor: activity.color || "#0F515C" }}
						/>
						<span className="text-xs text-gray-500 uppercase font-mono">
							{activity.color || "#0F515C"}
						</span>
					</div>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleDelete(activity.id);
						}}
						className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
					>
						<Trash2 size={16} />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						{t("activities_title")}
					</h1>
					<p className="text-sm text-gray-500">{t("activities_subtitle")}</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setSelectedActivity(null);
						setIsModalOpen(true);
					}}
					className="btn-primary flex items-center gap-2"
				>
					<Plus size={20} />
					{t("add_activity")}
				</button>
			</div>

			{/* Activities Table */}
			<DataTable
				data={initialActivities}
				columns={columns}
				searchPlaceholder={t("search")}
				onAction={handleAction}
			/>

			{/* Add/Edit Activity Modal */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedActivity(null);
				}}
				title={selectedActivity ? t("edit_activity") : t("add_activity")}
				footer={
					<>
						<button
							type="button"
							disabled={isPending}
							onClick={() => setIsModalOpen(false)}
							className="btn-ghost"
						>
							{t("cancel")}
						</button>
						<button
							form="activity-form"
							type="submit"
							disabled={isPending}
							className="btn-primary flex items-center gap-2"
						>
							{isPending && <Loader2 size={16} className="animate-spin" />}
							{selectedActivity ? t("save_changes") : t("add")}
						</button>
					</>
				}
			>
				<form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
					<Input
						name="name"
						label={t("activity_name")}
						defaultValue={selectedActivity?.name ?? undefined}
						placeholder="Ex: Mathématiques"
						required
					/>
					<Input
						name="duration"
						label={t("default_duration")}
						type="number"
						defaultValue={selectedActivity?.duration ?? undefined}
						placeholder="En minutes"
						required
					/>
					<TextArea
						name="description"
						label={t("description")}
						defaultValue={selectedActivity?.description ?? undefined}
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Input
							name="color"
							label={t("label_color")}
							type="color"
							defaultValue={selectedActivity?.color || "#0F515C"}
							className="h-12"
						/>
					</div>
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
