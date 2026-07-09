"use client";

import type { NiveauScolaire } from "@prisma/client";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	Download,
	Edit3,
	Eye,
	LayoutGrid,
	List,
	Mail,
	Phone,
	Plus,
	Trash2,
	User,
	Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { deleteStudentAction } from "@/actions/students.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { PageHeader } from "@/components/ui/primitives";
import { Link, useRouter } from "@/i18n/routing";
import {
	type CsvCell,
	csvDateStamp,
	downloadCsv,
	toCsv,
} from "@/lib/export-csv";
import { useDashboardView } from "@/lib/hooks/useDashboardView";
import { niveauShort, niveauxByCycle } from "@/lib/niveaux";
import type { Group, PaymentPlan, Student } from "@/types/schema";
import { formatDate, formatFullName } from "@/utils/format";
import { StudentAvatar } from "./StudentAvatar";
import StudentCard from "./StudentCard";
import StudentFormModal from "./StudentFormModal";
import { StudentPdfPreviewModal } from "./StudentPdfPreviewModal";

type StudentWithGroups = Student & {
	groups: Group[];
	paymentPlans: PaymentPlan[];
};

interface StudentsClientViewProps {
	initialStudents: StudentWithGroups[];
	groups: Group[];
}

export default function StudentsClientView({
	initialStudents = [],
	groups = [],
}: StudentsClientViewProps) {
	const {
		isModalOpen,
		setIsModalOpen,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		itemToDelete,
		setItemToDelete,
		errorMessage,
		setErrorMessage,
		selectedItem: selectedStudent,
		setSelectedItem: setSelectedStudent,
		isPending,
		startTransition,
		optimisticItems: optimisticStudents,
		applyOptimistic,
		handleOpenDelete,
	} = useDashboardView<StudentWithGroups>(initialStudents);

	const [pdfError, setPdfError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"table" | "grid">("table");
	const locale = useLocale();
	const [niveauFilter, setNiveauFilter] = useState<NiveauScolaire | "all">(
		"all",
	);
	const filteredStudents = useMemo(
		() =>
			niveauFilter === "all"
				? optimisticStudents
				: optimisticStudents.filter((s) => s.niveau === niveauFilter),
		[optimisticStudents, niveauFilter],
	);
	const [previewStudent, setPreviewStudent] =
		useState<StudentWithGroups | null>(null);

	const t = useTranslations();
	const router = useRouter();

	const handleEdit = (student: StudentWithGroups) => {
		setSelectedStudent(student);
		setIsModalOpen(true);
	};

	const handleAdd = () => {
		setSelectedStudent(null);
		setIsModalOpen(true);
	};

	// Export effectifs (CSV Excel-ready) — rapport pour le dirigeant / la compta.
	const handleExportCSV = () => {
		const headers = [
			t("students_identity"),
			t("status"),
			t("students_type_label"),
			t("students_niveau"),
			t("students_phone_col"),
			t("students_groups_col"),
			t("students_registration_date"),
		];
		const rows: CsvCell[][] = filteredStudents.map((s) => [
			formatFullName(s.firstName, s.lastName),
			s.isActive ? t("active") : t("inactive"),
			s.isMinor ? t("minor") : t("adult"),
			niveauShort(s.niveau) || "—",
			(s.isMinor ? s.parentPhone : s.phone) || "—",
			s.groups.map((g) => g.name).join(" / ") || "—",
			formatDate(s.registrationDate),
		]);
		downloadCsv(`effectifs_${csvDateStamp()}.csv`, toCsv(headers, rows));
	};

	const confirmDelete = async () => {
		if (!itemToDelete) return;
		const id = itemToDelete;
		setIsDeleteModalOpen(false);
		setItemToDelete(null);
		startTransition(async () => {
			applyOptimistic({ type: "delete", id });
			const result = await deleteStudentAction({ id });
			if (!result.success) {
				setErrorMessage(result.error.message);
			}
			router.refresh();
		});
	};

	// "Télécharger la fiche" now opens an in-app preview (with download/print
	// inside) instead of a blind download.
	const handleDownloadPDF = (student: StudentWithGroups) => {
		setPreviewStudent(student);
	};

	const columns = [
		{
			header: t("students_identity"),
			accessor: (student: StudentWithGroups) => (
				<Link
					href={`/dashboard/students/${student.id}`}
					className="group/name flex items-center gap-4"
				>
					<StudentAvatar
						src={student.photoUrl}
						name={formatFullName(student.firstName, student.lastName)}
						size={44}
						rounded="rounded-2xl"
						className="shadow-sm"
					/>
					<div className="flex flex-col">
						<span className="font-bold text-ink-900 text-sm leading-tight tracking-tight group-hover/name:text-brand-600 transition-colors">
							{formatFullName(student.firstName, student.lastName)}
						</span>
						<div className="flex items-center gap-2 mt-1">
							{student.isMinor && (
								<span className="px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider border border-amber-200/50">
									{t("student_minor")}
								</span>
							)}
							{student.niveau && (
								<span className="px-1.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 text-[9px] font-bold uppercase tracking-wider border border-brand-200/50">
									{niveauShort(student.niveau)}
								</span>
							)}
							<span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
								{formatDate(student.registrationDate)}
							</span>
						</div>
					</div>
				</Link>
			),
		},
		{
			header: t("students_contact"),
			accessor: (student: StudentWithGroups) => (
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-xs font-bold text-ink-700">
						<Phone size={12} className="text-brand-500" />
						<span className="tabular-nums">
							{student.isMinor ? student.parentPhone : student.phone || "—"}
						</span>
					</div>
					{student.email && (
						<div className="flex items-center gap-2 text-[10px] font-semibold text-ink-400">
							<Mail size={12} className="opacity-40" />
							<span className="truncate max-w-[140px]">{student.email}</span>
						</div>
					)}
				</div>
			),
		},
		{
			header: t("students_assignment"),
			accessor: (student: StudentWithGroups) => (
				<div className="flex flex-wrap gap-1.5 max-w-[240px]">
					{student.groups.length > 0 ? (
						student.groups.map((g) => (
							<span
								key={g.id}
								className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-900 text-[10px] font-bold uppercase tracking-wider border border-brand-100"
							>
								{g.name}
							</span>
						))
					) : (
						<span className="text-[10px] font-bold text-ink-300 uppercase tracking-widest italic">
							{t("students_no_group")}
						</span>
					)}
				</div>
			),
		},
		{
			header: "Solde",
			accessor: (student: StudentWithGroups) => {
				const totalDue =
					student.paymentPlans?.reduce(
						(acc, p) => acc + (p.totalAmount - p.paidAmount),
						0,
					) || 0;
				return (
					<div className="flex items-center gap-2">
						<Wallet
							size={14}
							className={clsx(totalDue > 0 ? "text-danger" : "text-success")}
						/>
						<span
							className={clsx(
								"text-xs font-bold tabular-nums",
								totalDue > 0 ? "text-danger" : "text-success",
							)}
						>
							{totalDue.toLocaleString()} DA
						</span>
					</div>
				);
			},
		},
		{
			header: "Statut",
			accessor: (student: StudentWithGroups) => (
				<span
					className={clsx(
						"inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border",
						student.isActive
							? "bg-success-50 text-success border-success/10"
							: "bg-rose-50 text-danger border-danger/10",
					)}
				>
					<div
						className={clsx(
							"w-1.5 h-1.5 rounded-full me-2",
							student.isActive ? "bg-success animate-pulse" : "bg-danger",
						)}
					/>
					{student.isActive ? t("active") : t("inactive")}
				</span>
			),
		},
		{
			header: "",
			accessor: (student: StudentWithGroups) => (
				<div className="flex justify-end">
					<DropdownMenu
						items={[
							{
								label: t("student_view_file"),
								icon: <Eye size={14} />,
								href: `/dashboard/students/${student.id}`,
							},
							{
								label: t("student_download_file"),
								icon: <Download size={14} />,
								onClick: () => handleDownloadPDF(student),
							},
							{
								label: t("student_edit"),
								icon: <Edit3 size={14} />,
								onClick: () => handleEdit(student),
							},
							{
								label: t("delete"),
								icon: <Trash2 size={14} />,
								variant: "danger",
								onClick: () => handleOpenDelete(student.id),
							},
						]}
					/>
				</div>
			),
			className: "w-10",
		},
	];

	return (
		<div className="space-y-10 pb-20 pt-4">
			<PageHeader
				eyebrow={t("students_manage_title")}
				title={t("students_title_prefix")}
				accent={t("students_title_accent")}
				subtitle={t("students_manage_subtitle")}
				actions={
					<>
						<select
							value={niveauFilter}
							onChange={(e) =>
								setNiveauFilter(e.target.value as NiveauScolaire | "all")
							}
							className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-900 outline-none transition focus:border-brand-500"
							aria-label={t("students_niveau")}
						>
							<option value="all">{t("students_all_levels")}</option>
							{niveauxByCycle(locale).map((cycle) => (
								<optgroup key={cycle.cycle} label={cycle.label}>
									{cycle.options.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</optgroup>
							))}
						</select>
						<div className="bg-surface-50 p-1 rounded-xl flex gap-1 border border-line">
							<button
								onClick={() => setViewMode("table")}
								className={clsx(
									"p-2 rounded-lg transition-all",
									viewMode === "table"
										? "bg-white text-brand-500 shadow-sm"
										: "text-ink-400 hover:text-ink-900",
								)}
							>
								<List size={20} />
							</button>
							<button
								onClick={() => setViewMode("grid")}
								className={clsx(
									"p-2 rounded-lg transition-all",
									viewMode === "grid"
										? "bg-white text-brand-500 shadow-sm"
										: "text-ink-400 hover:text-ink-900",
								)}
							>
								<LayoutGrid size={20} />
							</button>
						</div>
						<button
							type="button"
							onClick={handleExportCSV}
							className="btn btn--secondary btn--md"
						>
							<Download size={18} />
							{t("export_csv")}
						</button>
						<button
							type="button"
							onClick={handleAdd}
							className="btn btn--primary btn--md"
						>
							<Plus size={20} />
							{t("students_new_registry")}
						</button>
					</>
				}
			/>

			{viewMode === "table" ? (
				<DataTable
					data={filteredStudents}
					columns={columns}
					searchPlaceholder={t("students_search_placeholder")}
					hideDefaultAction={true}
				/>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
					{filteredStudents.map((student) => (
						<StudentCard
							key={student.id}
							student={student}
							onEdit={handleEdit}
							onDelete={handleOpenDelete}
							onDownloadPDF={handleDownloadPDF}
						/>
					))}
					{optimisticStudents.length === 0 && (
						<div className="col-span-full py-32 text-center bg-white rounded-[32px] border-2 border-dashed border-line">
							<User size={48} className="mx-auto mb-4 text-ink-100" />
							<p className="font-bold uppercase tracking-widest text-[11px] text-ink-300">
								Aucun étudiant trouvé
							</p>
						</div>
					)}
				</div>
			)}

			<ConfirmModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
				title={t("students_delete_title")}
				message={t("students_delete_message")}
				confirmLabel={t("delete")}
				variant="danger"
				isLoading={isPending}
				size="lg"
			/>

			<StudentFormModal
				key={selectedStudent?.id || "new"}
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedStudent(null);
				}}
				student={selectedStudent}
				groups={groups}
			/>

			{previewStudent && (
				<StudentPdfPreviewModal
					student={previewStudent}
					isOpen={!!previewStudent}
					onClose={() => setPreviewStudent(null)}
				/>
			)}

			{/* Error Notification */}
			<AnimatePresence>
				{errorMessage && (
					<motion.div
						initial={{ opacity: 0, y: 100 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 100 }}
						className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white border-2 border-danger/20 shadow-2xl rounded-2xl p-4 flex items-start gap-4 min-w-[320px] max-w-md"
					>
						<div className="p-2 bg-rose-50 rounded-xl text-danger shrink-0">
							<AlertCircle size={20} />
						</div>
						<div className="flex-1">
							<h4 className="text-sm font-bold text-ink-900 mb-1">Attention</h4>
							<p className="text-xs text-ink-500 leading-relaxed font-medium">
								{errorMessage}
							</p>
							<button
								onClick={() => setErrorMessage(null)}
								className="mt-3 text-[10px] font-bold text-brand-500 uppercase tracking-widest hover:text-brand-700"
							>
								{t("students_understood")}
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{pdfError && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="fixed top-24 right-8 z-[100] bg-rose-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-3"
					>
						<AlertCircle size={16} />
						{pdfError}
						<button
							onClick={() => setPdfError(null)}
							className="ml-2 hover:opacity-70 transition-opacity"
						>
							✕
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
