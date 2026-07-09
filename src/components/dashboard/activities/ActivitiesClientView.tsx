"use client";

import {
	BookOpen,
	CalendarClock,
	Clock,
	Loader2,
	Plus,
	Trash2,
	Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
	createActivityAction,
	deleteActivityAction,
	updateActivityAction,
} from "@/actions/logistics.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import { Input, TextArea } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { Button, PageHeader, StatCard } from "@/components/ui/primitives";
import { useRouter } from "@/i18n/routing";
import { localizedSubject } from "@/lib/subjects";
import type { Activity } from "@/types/schema";

/* An activity carries its usage: séances planifiées + plans de paiement liés. */
type ActivityWithUsage = Activity & {
	_count: { sessions: number; paymentPlans: number };
};

interface ActivitiesClientViewProps {
	initialActivities: ActivityWithUsage[];
}

export default function ActivitiesClientView({
	initialActivities = [],
}: ActivitiesClientViewProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [activityToDelete, setActivityToDelete] =
		useState<ActivityWithUsage | null>(null);
	const [selectedActivity, setSelectedActivity] =
		useState<ActivityWithUsage | null>(null);
	const [isPending, startTransition] = useTransition();
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();

	const metrics = useMemo(() => {
		const total = initialActivities.length;
		const durations = initialActivities
			.map((a) => a.duration ?? 0)
			.filter((d) => d > 0);
		const avgDuration = durations.length
			? Math.round(durations.reduce((a, d) => a + d, 0) / durations.length)
			: 0;
		const totalSessions = initialActivities.reduce(
			(a, x) => a + x._count.sessions,
			0,
		);
		return { total, avgDuration, totalSessions };
	}, [initialActivities]);

	const handleAction = (activity: ActivityWithUsage) => {
		setSelectedActivity(activity);
		setIsModalOpen(true);
	};

	const handleDelete = (activity: ActivityWithUsage) => {
		setActivityToDelete(activity);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!activityToDelete) return;
		startTransition(async () => {
			const result = await deleteActivityAction({ id: activityToDelete.id });
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
			accessor: (activity: ActivityWithUsage) => (
				<div className="flex items-center gap-3">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-ts-1"
						style={{ backgroundColor: activity.color || "#0F515C" }}
					>
						<BookOpen size={20} />
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-ink-900 text-sm">
							{localizedSubject(activity.name, locale)}
						</span>
						<span className="text-xs font-medium text-ink-400">
							{t("duration_mins", { count: activity.duration ?? 0 })}
						</span>
					</div>
				</div>
			),
		},
		{
			header: t("default_duration"),
			accessor: (activity: ActivityWithUsage) => (
				<div className="flex items-center gap-2 text-ink-700">
					<Clock size={16} className="text-ink-400" />
					<span className="font-semibold tabular-nums">
						{activity.duration ?? 0} min
					</span>
				</div>
			),
		},
		{
			header: "Occupation",
			accessor: (activity: ActivityWithUsage) => (
				<div className="flex flex-wrap items-center gap-1.5">
					{activity._count.sessions > 0 ? (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
							<CalendarClock size={13} />
							{activity._count.sessions} séance
							{activity._count.sessions > 1 ? "s" : ""}
						</span>
					) : (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-bold text-ink-400">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
							Libre
						</span>
					)}
					{activity._count.paymentPlans > 0 && (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1 text-xs font-bold text-brass">
							<Wallet size={13} />
							{activity._count.paymentPlans} plan
							{activity._count.paymentPlans > 1 ? "s" : ""}
						</span>
					)}
				</div>
			),
		},
		{
			header: t("actions"),
			accessor: (activity: ActivityWithUsage) => {
				const used =
					activity._count.sessions > 0 || activity._count.paymentPlans > 0;
				return (
					<div className="flex items-center justify-end">
						<button
							type="button"
							disabled={used}
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(activity);
							}}
							className={
								used
									? "inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl text-ink-300"
									: "inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-rose-50 hover:text-danger"
							}
							title={
								used
									? "Activité utilisée (séances ou plans) — impossible de supprimer"
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
				eyebrow={t("activities_title")}
				title="Gestion des"
				accent="Activités"
				subtitle={t("activities_subtitle")}
				actions={
					<Button
						onClick={() => {
							setSelectedActivity(null);
							setIsModalOpen(true);
						}}
						icon={<Plus size={18} />}
					>
						{t("add_activity")}
					</Button>
				}
			/>

			{/* KPIs — concordent avec Salles / Groupes */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label={t("activities_total")}
					value={metrics.total}
					icon={<BookOpen size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("activities_avg_duration")}
					value={`${metrics.avgDuration} min`}
					icon={<Clock size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("activities_linked_sessions")}
					value={metrics.totalSessions}
					icon={<CalendarClock size={20} />}
					tone="positive"
					hint={t("activities_schedule_occupation")}
				/>
			</div>

			{/* Activities Table */}
			<DataTable
				data={initialActivities}
				columns={columns}
				searchPlaceholder={t("search")}
				onAction={handleAction}
				hideDefaultAction={true}
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
