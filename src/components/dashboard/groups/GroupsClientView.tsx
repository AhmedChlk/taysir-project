"use client";

import { clsx } from "clsx";
import {
	CheckCircle2,
	Inbox,
	Loader2,
	Plus,
	Trash2,
	TrendingUp,
	UserMinus,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
	createGroupAction,
	deleteGroupAction,
	updateGroupAction,
} from "@/actions/logistics.actions";
import {
	addStudentToGroupAction,
	removeStudentFromGroupAction,
} from "@/actions/students.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import { Input, Select } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { PageHeader, StatCard } from "@/components/ui/primitives";
import { useRouter } from "@/i18n/routing";
import type {
	Activity,
	Group,
	Student,
	User as UserType,
} from "@/types/schema";

interface GroupsClientViewProps {
	initialGroups: Group[];
	activities: Activity[];
	staff: UserType[];
	students: Student[];
}

type OptimisticGroupAction =
	| { type: "delete"; id: string }
	| { type: "create"; group: Group }
	| { type: "update"; group: Group };

export default function GroupsClientView({
	initialGroups = [],
	activities: _activities = [],
	staff: _staff = [],
	students = [],
}: GroupsClientViewProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({
		isOpen: false,
		title: "",
		message: "",
		onConfirm: () => {},
	});
	const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
	const [isPending, startTransition] = useTransition();
	const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>("");
	const t = useTranslations();
	const router = useRouter();

	const [optimisticGroups, applyOptimistic] = useOptimistic(
		initialGroups,
		(state: Group[], action: OptimisticGroupAction) => {
			switch (action.type) {
				case "delete":
					return state.filter((g) => g.id !== action.id);
				case "create":
					return [...state, action.group];
				case "update":
					return state.map((g) =>
						g.id === action.group.id ? action.group : g,
					);
				default:
					return state;
			}
		},
	);

	const metrics = useMemo(() => {
		const totalGroups = optimisticGroups.length;
		const activeGroups = optimisticGroups.filter((g) => g.isActive).length;
		const totalStudentsInGroups = optimisticGroups.reduce(
			(acc, g) => acc + (g.students?.length || 0),
			0,
		);
		const avgStudents =
			totalGroups > 0 ? Math.round(totalStudentsInGroups / totalGroups) : 0;

		return { totalGroups, activeGroups, totalStudentsInGroups, avgStudents };
	}, [optimisticGroups]);

	const handleAction = (group: Group) => {
		setSelectedGroup(group);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string) => {
		setConfirmModal({
			isOpen: true,
			title: t("confirm_delete"),
			message: t("confirm_delete_desc") || t("confirm_delete"),
			onConfirm: () => {
				startTransition(async () => {
					applyOptimistic({ type: "delete", id });
					const result = await deleteGroupAction({ id });
					if (!result.success) {
						alert(result.error.message);
					}
					setConfirmModal((prev) => ({ ...prev, isOpen: false }));
					router.refresh();
				});
			},
		});
	};

	const handleRemoveStudent = (studentId: string, groupId: string) => {
		setConfirmModal({
			isOpen: true,
			title: t("groups_remove_confirm_title") || t("groups_remove_confirm"),
			message: t("groups_remove_confirm"),
			onConfirm: () => {
				startTransition(async () => {
					const result = await removeStudentFromGroupAction({
						studentId,
						groupId,
					});
					if (result.success) {
						router.refresh();
						if (selectedGroup) {
							setSelectedGroup({
								...selectedGroup,
								students:
									selectedGroup.students?.filter((s) => s.id !== studentId) ??
									[],
							});
						}
					} else {
						alert(result.error.message);
					}
					setConfirmModal((prev) => ({ ...prev, isOpen: false }));
				});
			},
		});
	};

	const handleAddStudent = async () => {
		if (!selectedStudentToAdd || !selectedGroup) return;

		startTransition(async () => {
			const result = await addStudentToGroupAction({
				studentId: selectedStudentToAdd,
				groupId: selectedGroup.id,
			});

			if (result.success) {
				setSelectedStudentToAdd("");
				router.refresh();
				const studentObj = students.find((s) => s.id === selectedStudentToAdd);
				if (selectedGroup && studentObj) {
					setSelectedGroup({
						...selectedGroup,
						students: [...(selectedGroup.students || []), studentObj],
					});
				}
			} else {
				alert(result.error.message);
			}
		});
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;

		startTransition(async () => {
			let result;
			if (selectedGroup) {
				const optimisticGroup: Group = { ...selectedGroup, name };
				applyOptimistic({ type: "update", group: optimisticGroup });
				result = await updateGroupAction({ id: selectedGroup.id, name });
			} else {
				result = await createGroupAction({ name });
			}

			if (result.success) {
				setIsModalOpen(false);
				setSelectedGroup(null);
				router.refresh();
			} else {
				alert(result.error.message);
			}
		});
	};

	const columns = [
		{
			header: t("group_name"),
			accessor: (group: Group) => (
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 shadow-ts-1">
						<Users size={22} />
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-ink-900 text-sm">{group.name}</span>
						<span className="text-xs text-ink-400 font-medium">
							{group.students?.length || 0}{" "}
							{(group.students?.length || 0) > 1
								? t("groups_students_plural")
								: t("groups_students_singular")}
						</span>
					</div>
				</div>
			),
		},
		{
			header: t("registrations"),
			accessor: (group: Group) => (
				<div className="flex items-center gap-2">
					<div className="flex -space-x-2">
						{(group.students || []).slice(0, 3).map((_, i) => (
							<div
								key={i}
								className="h-8 w-8 rounded-full border-2 border-white bg-surface-100 flex items-center justify-center text-xs font-bold text-ink-500 shadow-ts-1"
							>
								<UserTypeIcon />
							</div>
						))}
						{(group.students?.length || 0) > 3 && (
							<div className="h-8 w-8 rounded-full border-2 border-white bg-surface-50 flex items-center justify-center text-xs font-bold text-ink-400 shadow-ts-1">
								+{(group.students?.length || 0) - 3}
							</div>
						)}
					</div>
					<span className="text-sm font-semibold text-ink-700 ml-2">
						{group.students?.length || 0}{" "}
						{(group.students?.length || 0) > 1
							? t("groups_students_plural")
							: t("groups_students_singular")}
					</span>
				</div>
			),
		},
		{
			header: t("status_header"),
			accessor: (group: Group) => (
				<span
					className={clsx(
						"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border",
						group.isActive
							? "bg-success-50 text-success border-success/10"
							: "bg-rose-50 text-danger border-danger/10",
					)}
				>
					<span
						className={clsx(
							"h-1.5 w-1.5 rounded-full",
							group.isActive ? "bg-success" : "bg-danger",
						)}
					/>
					{group.isActive ? t("active") : t("inactive")}
				</span>
			),
		},
		{
			header: t("actions"),
			accessor: (group: Group) => (
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleDelete(group.id);
						}}
						className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-rose-50 hover:text-danger"
						title={t("delete")}
					>
						<Trash2 size={18} />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("groups_title")}
				title="Gestion des"
				accent="Groupes"
				subtitle={t("groups_subtitle")}
				actions={
					<button
						type="button"
						onClick={() => {
							setSelectedGroup(null);
							setIsModalOpen(true);
							if (navigator.vibrate) navigator.vibrate(50);
						}}
						className="btn btn--primary btn--md"
					>
						<Plus size={20} strokeWidth={2.5} />
						{t("add_group")}
					</button>
				}
			/>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					label={t("groups_total_count")}
					value={metrics.totalGroups}
					icon={<Users size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("groups_active_count")}
					value={metrics.activeGroups}
					icon={<CheckCircle2 size={20} />}
					tone="positive"
				/>
				<StatCard
					label={t("groups_enrolled_count")}
					value={metrics.totalStudentsInGroups}
					icon={<TrendingUp size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("groups_avg_students")}
					value={metrics.avgStudents}
					icon={<Users size={20} />}
					tone="warning"
				/>
			</div>

			{/* Main Table */}
			<DataTable
				data={optimisticGroups}
				columns={columns}
				searchPlaceholder={t("groups_search_placeholder")}
				onAction={handleAction}
				hideDefaultAction={true}
			/>

			{/* Modal */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedGroup(null);
				}}
				title={selectedGroup ? t("groups_manage") : t("groups_new")}
				footer={
					<div className="flex items-center justify-end gap-3 w-full">
						<button
							type="button"
							disabled={isPending}
							onClick={() => setIsModalOpen(false)}
							className="btn btn--ghost btn--md"
						>
							{t("cancel")}
						</button>
						<button
							form="group-form"
							type="submit"
							disabled={isPending}
							className="btn btn--primary btn--md"
						>
							{isPending && <Loader2 size={18} className="animate-spin" />}
							{selectedGroup ? t("save_changes") : t("add")}
						</button>
					</div>
				}
			>
				<div className="space-y-8 py-2">
					{/* Edit Form */}
					<form
						id="group-form"
						onSubmit={handleSubmit}
						className="bg-surface-50 p-5 rounded-2xl border border-line/60 space-y-4"
					>
						<h4 className="text-sm font-bold text-ink-900 flex items-center gap-2 mb-4">
							<div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center text-brand-500">
								1
							</div>
							{t("groups_general_info")}
						</h4>
						<Input
							name="name"
							label={t("group_name")}
							defaultValue={selectedGroup?.name}
							placeholder="Ex: Groupe A - Mathématiques"
							required
						/>
					</form>

					{/* Students Management Section (Only visible if Editing) */}
					{selectedGroup && (
						<div className="space-y-6">
							<h4 className="text-sm font-bold text-ink-900 flex items-center gap-2">
								<div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center text-brand-500">
									2
								</div>
								{t("groups_student_management")}
							</h4>

							{/* Add Student Row */}
							<div className="flex gap-3 items-end bg-white p-4 rounded-2xl border border-line/60 shadow-ts-1">
								<div className="flex-1">
									<Select
										label={t("groups_add_new_student")}
										value={selectedStudentToAdd}
										onChange={(e) => setSelectedStudentToAdd(e.target.value)}
										options={[
											{ label: t("groups_select_student"), value: "" },
											...students
												.filter(
													(s) =>
														!selectedGroup.students?.some(
															(gs) => gs.id === s.id,
														),
												)
												.map((s) => ({
													label: `${s.firstName} ${s.lastName} ${s.email ? `(${s.email})` : ""}`,
													value: s.id,
												})),
										]}
									/>
								</div>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										if (navigator.vibrate) navigator.vibrate(50);
										handleAddStudent();
									}}
									disabled={isPending || !selectedStudentToAdd}
									className="btn btn--secondary btn--md mb-1.5"
								>
									<Plus size={18} />
									{t("add")}
								</button>
							</div>

							{/* Student List */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-bold text-ink-400 uppercase tracking-wider">
										{t("groups_enrolled_count_detail", {
											count: selectedGroup.students?.length || 0,
										})}
									</span>
								</div>

								{!selectedGroup.students ||
								selectedGroup.students.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-10 bg-surface-50 border border-dashed border-line/60 rounded-2xl">
										<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-ts-1 mb-4">
											<Inbox size={24} className="text-ink-300" />
										</div>
										<h3 className="text-sm font-bold text-ink-700 mb-1">
											{t("groups_no_students")}
										</h3>
										<p className="text-xs text-ink-500 text-center max-w-[250px]">
											{t("groups_empty_group_desc")}
										</p>
									</div>
								) : (
									<div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
										{selectedGroup.students.map((student) => (
											<div
												key={student.id}
												className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-line/60 shadow-ts-1 hover:border-line transition-all group"
											>
												<div className="flex items-center gap-3">
													<div className="h-10 w-10 rounded-full bg-surface-100 flex items-center justify-center font-bold text-ink-500 text-sm">
														{student.firstName.charAt(0)}
														{student.lastName.charAt(0)}
													</div>
													<div className="flex flex-col">
														<span className="text-sm font-bold text-ink-900 group-hover:text-brand-500 transition-colors">
															{student.firstName} {student.lastName}
														</span>
														<span className="text-xs font-medium text-ink-500">
															{student.email ||
																student.phone ||
																t("student_not_provided")}
														</span>
													</div>
												</div>
												<button
													type="button"
													onClick={(e) => {
														e.preventDefault();
														handleRemoveStudent(student.id, selectedGroup.id);
													}}
													disabled={isPending}
													className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 opacity-0 transition-all hover:bg-rose-50 hover:text-danger group-hover:opacity-100 focus:opacity-100"
													title={t("delete")}
												>
													<UserMinus size={18} />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</Modal>

			<ConfirmModal
				isOpen={confirmModal.isOpen}
				onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
				onConfirm={confirmModal.onConfirm}
				title={confirmModal.title}
				message={confirmModal.message}
				confirmLabel={t("confirm")}
				variant="danger"
				isLoading={isPending}
			/>
		</div>
	);
}

function UserTypeIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	);
}
