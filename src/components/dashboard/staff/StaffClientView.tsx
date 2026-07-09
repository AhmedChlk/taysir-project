"use client";

import { clsx } from "clsx";
import {
	CalendarClock,
	CheckCircle2,
	Filter,
	GraduationCap,
	Key,
	Loader2,
	Mail,
	ShieldCheck,
	Trash2,
	UserPlus,
	Users,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
	createUserAction,
	deleteUserAction,
	resetUserPasswordAction,
	updateUserAction,
} from "@/actions/users.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import { Input, Select } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { Button, PageHeader, StatCard } from "@/components/ui/primitives";
import { Toggle } from "@/components/ui/Toggle";
import { useRouter } from "@/i18n/routing";
import { type User as StaffMember, UserRole } from "@/types/schema";
import { formatFullName } from "@/utils/format";

/* A staff member carries their teaching load (séances assurées). */
type StaffWithUsage = StaffMember & { _count: { sessions: number } };

interface StaffClientViewProps {
	initialStaff: StaffWithUsage[];
}

export default function StaffClientView({
	initialStaff = [],
}: StaffClientViewProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
	const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
	const [roleFilter, setRoleFilter] = useState<string>("ALL");
	const [newPassword, setNewPassword] = useState("");
	const [isPending, startTransition] = useTransition();
	const t = useTranslations();
	const router = useRouter();

	const metrics = useMemo(() => {
		const total = initialStaff.length;
		const active = initialStaff.filter((s) => s.status === "ACTIVE").length;
		const teachers = initialStaff.filter(
			(s) => s.role === UserRole.INTERVENANT,
		).length;
		const sessions = initialStaff.reduce((a, s) => a + s._count.sessions, 0);
		return { total, active, teachers, sessions };
	}, [initialStaff]);

	const handleAction = (u: StaffMember) => {
		setSelectedStaff(u);
		setIsModalOpen(true);
	};

	const handleToggleStatus = async (user: StaffMember) => {
		startTransition(async () => {
			const result = await updateUserAction({
				id: user.id,
				status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
			});
			if (result.success) {
				router.refresh();
			}
		});
	};

	const handleResetPassword = async () => {
		if (!selectedStaff || newPassword.length < 8) return;

		startTransition(async () => {
			const result = await resetUserPasswordAction({
				id: selectedStaff.id,
				newPassword,
			});
			if (result.success) {
				setIsResetModalOpen(false);
				setNewPassword("");
				alert(t("save_success"));
			} else {
				alert(result.error.message);
			}
		});
	};

	const handleDelete = (id: string) => {
		setStaffToDelete(id);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!staffToDelete) return;

		startTransition(async () => {
			const result = await deleteUserAction({ id: staffToDelete });
			if (result.success) {
				setIsDeleteModalOpen(false);
				setStaffToDelete(null);
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
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			email: formData.get("email") as string,
			role: formData.get("role") as UserRole,
			password: (formData.get("password") as string) || "Default123!", // En prod, générer ou demander
		};

		startTransition(async () => {
			let result;
			if (selectedStaff) {
				result = await updateUserAction({ id: selectedStaff.id, ...data });
			} else {
				result = await createUserAction(data);
			}

			if (result.success) {
				setIsModalOpen(false);
				setSelectedStaff(null);
				router.refresh();
			} else {
				alert(result.error.message);
			}
		});
	};

	const columns = [
		{
			header: t("full_name"),
			accessor: (u: StaffMember) => (
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold">
						{u.firstName?.charAt(0)}
						{u.lastName?.charAt(0)}
					</div>
					<span className="font-medium text-ink-900">
						{formatFullName(u.firstName, u.lastName)}
					</span>
				</div>
			),
		},
		{
			header: t("email"),
			accessor: (u: StaffMember) => (
				<div className="flex items-center gap-2 text-ink-700">
					<Mail size={16} className="text-ink-400" />
					<span>{u.email}</span>
				</div>
			),
		},
		{
			header: t("role_header"),
			accessor: (u: StaffMember) => {
				const roleLabel =
					u.role === UserRole.GERANT
						? t("manager")
						: u.role === UserRole.SECRETAIRE
							? t("secretary")
							: t("teacher");
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
						<ShieldCheck size={12} />
						{roleLabel}
					</span>
				);
			},
		},
		{
			header: t("status_header"),
			accessor: (u: StaffMember) => (
				<div className="flex items-center gap-3">
					<Toggle
						enabled={u.status === "ACTIVE"}
						onChange={() => handleToggleStatus(u)}
					/>
					<span
						className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
							u.status === "ACTIVE"
								? "bg-green-100 text-green-700"
								: u.status === "ON_LEAVE"
									? "bg-amber-100 text-amber-700"
									: "bg-red-100 text-red-700"
						}`}
					>
						{u.status === "ACTIVE" ? (
							<CheckCircle2 size={10} />
						) : (
							<XCircle size={10} />
						)}
						{u.status === "ACTIVE"
							? t("active")
							: u.status === "ON_LEAVE"
								? t("on_leave")
								: t("inactive")}
					</span>
				</div>
			),
		},
		{
			header: t("actions"),
			accessor: (u: StaffMember) => (
				<div className="flex items-center justify-end gap-2">
					<button
						onClick={(e) => {
							e.stopPropagation();
							setSelectedStaff(u);
							setIsResetModalOpen(true);
						}}
						className="p-2 text-ink-400 hover:text-brand-500 hover:bg-brand-500/5 rounded-lg transition-all"
						title={t("reset_password")}
					>
						<Key size={18} />
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							handleDelete(u.id);
						}}
						className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
						title={t("delete")}
					>
						<Trash2 size={18} />
					</button>
				</div>
			),
		},
	];

	const filteredStaff = initialStaff.filter(
		(u) => roleFilter === "ALL" || u.role === roleFilter,
	);

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("staff_title")}
				title="Gestion du"
				accent="Personnel"
				subtitle={t("staff_subtitle")}
				actions={
					<Button
						variant="secondary"
						onClick={() => {
							setSelectedStaff(null);
							setIsModalOpen(true);
						}}
						icon={<UserPlus size={18} />}
					>
						{t("add_member")}
					</Button>
				}
			/>

			{/* KPIs — concordent avec Salles / Activités / Groupes */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={t("total_staff")}
					value={metrics.total}
					icon={<Users size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("active")}
					value={metrics.active}
					icon={<CheckCircle2 size={20} />}
					tone="positive"
				/>
				<StatCard
					label={t("teacher")}
					value={metrics.teachers}
					icon={<GraduationCap size={20} />}
					tone="brand"
				/>
				<StatCard
					label={t("staff_sessions_covered")}
					value={metrics.sessions}
					icon={<CalendarClock size={20} />}
					tone="positive"
					hint={t("staff_schedule_load")}
				/>
			</div>

			{/* Role Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<button
					onClick={() => setRoleFilter("ALL")}
					className={clsx(
						"flex items-center gap-2 text-sm border",
						roleFilter === "ALL"
							? "btn-primary border-brand-500"
							: "btn-ghost border-transparent hover:border-brand-500/20",
					)}
				>
					<Filter size={16} />
					{t("all_roles")}
				</button>
				{[UserRole.GERANT, UserRole.SECRETAIRE, UserRole.INTERVENANT].map(
					(role) => (
						<button
							key={role}
							onClick={() => setRoleFilter(role)}
							className={clsx(
								"text-sm border",
								roleFilter === role
									? "btn-primary border-brand-500"
									: "btn-ghost border-transparent hover:border-brand-500/20",
							)}
						>
							{role === UserRole.GERANT
								? t("manager")
								: role === UserRole.SECRETAIRE
									? t("secretary")
									: t("teacher")}
						</button>
					),
				)}
			</div>

			<DataTable
				data={filteredStaff}
				columns={columns}
				searchPlaceholder={t("search_staff_placeholder")}
				onAction={handleAction}
				hideDefaultAction={true}
			/>

			{/* Password Reset Modal */}
			<Modal
				isOpen={isResetModalOpen}
				onClose={() => setIsResetModalOpen(false)}
				title={t("reset_password")}
				footer={
					<>
						<button
							disabled={isPending}
							onClick={() => setIsResetModalOpen(false)}
							className="btn-ghost text-sm"
						>
							{t("cancel")}
						</button>
						<button
							onClick={handleResetPassword}
							disabled={isPending || newPassword.length < 8}
							className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
						>
							{isPending && <Loader2 size={16} className="animate-spin" />}
							{t("change_password")}
						</button>
					</>
				}
			>
				<div className="space-y-4">
					<p className="text-sm text-ink-500">
						{t("reset_password_desc", {
							name: formatFullName(
								selectedStaff?.firstName,
								selectedStaff?.lastName,
							),
						})}
					</p>
					<Input
						label={t("new_password")}
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						placeholder={t("min_8_chars_placeholder")}
						required
					/>
				</div>
			</Modal>

			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedStaff(null);
				}}
				title={selectedStaff ? t("edit_member") : t("add_staff_title")}
				footer={
					<>
						<button
							disabled={isPending}
							onClick={() => setIsModalOpen(false)}
							className="btn-ghost text-sm"
						>
							{t("cancel")}
						</button>
						<button
							form="staff-form"
							type="submit"
							disabled={isPending}
							className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
						>
							{isPending && <Loader2 size={16} className="animate-spin" />}
							{selectedStaff ? t("save_changes") : t("add")}
						</button>
					</>
				}
			>
				<form
					id="staff-form"
					onSubmit={handleSubmit}
					className="grid grid-cols-1 gap-4 sm:grid-cols-2"
				>
					<Input
						name="firstName"
						label={t("first_name")}
						defaultValue={selectedStaff?.firstName}
						placeholder={t("placeholder_first_name")}
						required
					/>
					<Input
						name="lastName"
						label={t("last_name")}
						defaultValue={selectedStaff?.lastName}
						placeholder={t("placeholder_last_name")}
						required
					/>
					<div className="sm:col-span-2">
						<Input
							name="email"
							label={t("email")}
							defaultValue={selectedStaff?.email}
							placeholder={t("placeholder_email")}
							type="email"
							required
						/>
					</div>
					<Select
						name="role"
						label={t("role_header")}
						defaultValue={selectedStaff?.role}
						options={[
							{ label: t("manager"), value: UserRole.GERANT },
							{ label: t("secretary"), value: UserRole.SECRETAIRE },
							{ label: t("teacher"), value: UserRole.INTERVENANT },
						]}
					/>
					{!selectedStaff && (
						<div className="sm:col-span-2">
							<Input
								name="password"
								label={t("password")}
								type="password"
								placeholder="••••••••"
								required
							/>
						</div>
					)}
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
