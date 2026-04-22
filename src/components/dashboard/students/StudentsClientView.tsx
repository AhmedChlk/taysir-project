"use client";

import {
	AlertCircle,
	Baby,
	Camera,
	Download,
	Edit3,
	Eye,
	Loader2,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	Trash2,
	User,
    Plus,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useOptimistic, useRef, useState, useTransition } from "react";
import {
	createStudentAction,
	deleteStudentAction,
	updateStudentAction,
} from "@/actions/students.actions";
import { uploadFileAction } from "@/actions/upload.actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DataTable from "@/components/ui/DataTable";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { Input, TextArea } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import MultiSelect from "@/components/ui/MultiSelect";
import { Toggle } from "@/components/ui/Toggle";
import { useRouter } from "@/i18n/routing";
import { generateStudentProfilePDF } from "@/lib/pdf-generators/student-profile";
import type { Group, Student } from "@/types/schema";
import { formatFullName } from "@/utils/format";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

type StudentWithGroups = Student & { groups: Group[] };

type OptimisticAction =
	| { type: "delete"; id: string }
	| { type: "create"; student: StudentWithGroups }
	| { type: "update"; student: StudentWithGroups };

interface StudentsClientViewProps {
	initialStudents: StudentWithGroups[];
	groups: Group[];
}

export default function StudentsClientView({
	initialStudents = [],
	groups = [],
}: StudentsClientViewProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selectedStudent, setSelectedStudent] =
		useState<StudentWithGroups | null>(null);
	const [isMinor, setIsMinor] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const t = useTranslations();
	const router = useRouter();

	const [optimisticStudents, applyOptimistic] = useOptimistic(
		initialStudents,
		(state: StudentWithGroups[], action: OptimisticAction) => {
			switch (action.type) {
				case "delete":
					return state.filter((s) => s.id !== action.id);
				case "create":
					return [...state, action.student];
				case "update":
					return state.map((s) =>
						s.id === action.student.id ? action.student : s,
					);
				default:
					return state;
			}
		},
	);

	const handleEdit = (student: StudentWithGroups) => {
		setSelectedStudent(student);
		setIsMinor(!!student.isMinor);
		setPhotoPreview(student.photoUrl || null);
		setSelectedGroupIds(student.groups.map((g) => g.id));
		setIsModalOpen(true);
	};

	const handleAdd = () => {
		setSelectedStudent(null);
		setIsMinor(false);
		setPhotoPreview(null);
		setSelectedGroupIds([]);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string) => {
		setStudentToDelete(id);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!studentToDelete) return;
		const id = studentToDelete;
		setIsDeleteModalOpen(false);
		setStudentToDelete(null);
		startTransition(async () => {
			applyOptimistic({ type: "delete", id });
			const result = await deleteStudentAction({ id });
			if (!result.success) {
				setErrorMessage(result.error.message);
			}
			router.refresh();
		});
	};

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setPhotoPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		let uploadedPhotoUrl = selectedStudent?.photoUrl || null;
		const file = fileInputRef.current?.files?.[0];

		if (!selectedStudent && !file) {
			setErrorMessage(t("students_photo_required"));
			return;
		}

		if (file) {
			const uploadData = new FormData();
			uploadData.append("file", file);
			const uploadRes = await uploadFileAction(uploadData);
			if (!uploadRes.success || !uploadRes.data?.url) {
				setErrorMessage(uploadRes.error || t("students_photo_upload_error"));
				return;
			}
			uploadedPhotoUrl = uploadRes.data.url;
		}

		const data = {
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			email: (formData.get("email") as string) || null,
			phone: (formData.get("phone") as string) || null,
			address: (formData.get("address") as string) || null,
			photoUrl: uploadedPhotoUrl as string,
			isMinor: isMinor,
			parentName: (formData.get("parentName") as string) || null,
			parentPhone: (formData.get("parentPhone") as string) || null,
			parentEmail: (formData.get("parentEmail") as string) || null,
			groupIds: selectedGroupIds,
		};

		const selectedGroups = groups.filter((g) =>
			selectedGroupIds.includes(g.id),
		);

		startTransition(async () => {
			let result;
			if (selectedStudent) {
				const optimisticUpdated: StudentWithGroups = {
					...selectedStudent,
					...data,
					groups: selectedGroups,
				};
				applyOptimistic({ type: "update", student: optimisticUpdated });
				result = await updateStudentAction({ id: selectedStudent.id, ...data });
			} else {
                const tempId = crypto.randomUUID();
                const optimisticNew: StudentWithGroups = {
                    id: tempId,
                    ...data,
                    isActive: true,
                    birthDate: null,
                    registrationDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    etablissementId: "", // Sera remplacé par le serveur
                    groups: selectedGroups,
                };
                applyOptimistic({ type: "create", student: optimisticNew });
				result = await createStudentAction(data);
			}

			if (result.success) {
				setIsModalOpen(false);
				setSelectedStudent(null);
				router.refresh();
			} else {
				setErrorMessage(result.error.message || t("error_generic"));
			}
		});
	};

	const handleDownloadPDF = (student: StudentWithGroups) => {
		try {
			const doc = generateStudentProfilePDF(student);
			doc.save(`Fiche_${student.lastName}_${student.firstName}.pdf`);
			setPdfError(null);
		} catch (error) {
			console.error("PDF Generation failed", error);
			setPdfError(t("students_pdf_error"));
		}
	};

	const columns = [
		{
			header: t("students_identity"),
			accessor: (student: Student) => (
				<div className="flex items-center gap-4">
					<div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-line shadow-sm shrink-0 bg-surface-100 flex items-center justify-center">
						{student.photoUrl ? (
							<Image
								src={student.photoUrl}
								alt={student.firstName}
								fill
								className="object-cover"
							/>
						) : (
							<User size={20} className="text-ink-400" />
						)}
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-ink-900 text-sm leading-tight tracking-tight">
							{formatFullName(student.firstName, student.lastName)}
						</span>
						<div className="flex items-center gap-2 mt-1">
							{student.isMinor && (
								<span className="px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider border border-amber-200/50">
									{t("student_minor")}
								</span>
							)}
							<span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
								{new Date(student.registrationDate).toLocaleDateString()}
							</span>
						</div>
					</div>
				</div>
			),
		},
		{
			header: t("students_contact"),
			accessor: (student: Student) => (
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
			header: "Statut",
			accessor: (student: Student) => (
				<span
					className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border",
						student.isActive
							? "bg-success-50 text-success border-success/10"
							: "bg-rose-50 text-danger border-danger/10"
					)}
				>
					<div
						className={clsx(
                            "w-1.5 h-1.5 rounded-full me-2",
                            student.isActive ? "bg-success animate-pulse" : "bg-danger"
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
								onClick: () => handleDelete(student.id),
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
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-1">
					<div className="t-eyebrow">{t("students_manage_title")}</div>
					<h1 className="text-4xl font-bold text-ink-900 tracking-tight">
						Gestion des <span className="text-brand-500">Inscriptions</span>
					</h1>
					<p className="text-ink-500 font-medium max-w-lg leading-relaxed">
						{t("students_manage_subtitle")}
					</p>
				</div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="btn btn--primary btn--lg shadow-xl shadow-brand-500/10 active:scale-95"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Nouveau Registre
                    </button>
                </div>
			</div>

			<DataTable
				data={optimisticStudents}
				columns={columns}
				searchPlaceholder={t("students_search_placeholder")}
				onAdd={handleAdd}
				hideDefaultAction={true}
			/>

			<ConfirmModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
				title={t("students_delete_title")}
				message={t("students_delete_message")}
				confirmLabel={t("delete")}
				variant="danger"
				isLoading={isPending}
			/>

			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedStudent(null);
				}}
				title={
					selectedStudent
						? t("students_update_file")
						: t("students_new_registration")
				}
			>
				<form
					id="student-form"
					onSubmit={handleSubmit}
					className="space-y-10 p-2 max-h-[75vh] overflow-y-auto custom-scrollbar"
				>
                    {/* Identification Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-line pb-4">
                            <User size={14} />
                            Identification Élève
                        </div>
                        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
                            <div className="relative group shrink-0">
                                <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-line shadow-sm bg-surface-50 flex items-center justify-center relative transition-all group-hover:border-brand-500/30">
                                    {photoPreview ? (
                                        <Image
                                            src={photoPreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User size={48} className="text-ink-200" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-[2px]"
                                    >
                                        <Camera size={24} />
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                <Input
                                    name="firstName"
                                    label={t("first_name")}
                                    defaultValue={selectedStudent?.firstName}
                                    placeholder="Ex: Karim"
                                    required
                                />
                                <Input
                                    name="lastName"
                                    label={t("last_name")}
                                    defaultValue={selectedStudent?.lastName}
                                    placeholder="Ex: Zidane"
                                    required
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        name="address"
                                        label={t("student_address_label")}
                                        defaultValue={selectedStudent?.address || ""}
                                        placeholder="Ex: Cité 1200 logements, Bat 12, Alger"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status & Minority */}
					<div 
                        onClick={() => setIsMinor(!isMinor)}
                        className="p-6 bg-surface-50 rounded-2xl border border-line flex items-center justify-between cursor-pointer hover:bg-surface-100 transition-colors group/toggle"
                    >
						<div className="flex items-center gap-4">
							<div className={clsx(
                                "p-2.5 rounded-xl shadow-sm border transition-all duration-300",
                                isMinor ? "bg-brand-500 text-white border-brand-500" : "bg-white text-ink-400 border-line"
                            )}>
								<Baby size={20} strokeWidth={2.5} />
							</div>
							<div>
								<span className="text-sm font-bold text-ink-900 block">
									{isMinor ? "Élève Mineur" : "Élève Majeur"}
								</span>
								<span className="text-xs font-medium text-ink-400">
									{isMinor ? "Coordonnées parents obligatoires" : "Coordonnées personnelles utilisées"}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-3">
                            <span className={clsx("text-[10px] font-bold uppercase tracking-widest transition-colors", !isMinor ? "text-brand-500" : "text-ink-300")}>Majeur</span>
						    <Toggle enabled={isMinor} onChange={setIsMinor} />
                            <span className={clsx("text-[10px] font-bold uppercase tracking-widest transition-colors", isMinor ? "text-brand-500" : "text-ink-300")}>Mineur</span>
                        </div>
					</div>

                    {/* Contact Section */}
					<div className="space-y-6">
						<div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-line pb-4">
							<ShieldCheck size={14} />
							{t("students_contact_section")}
						</div>

						{!isMinor ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<Input
									name="email"
									type="email"
									label={t("email")}
									defaultValue={selectedStudent?.email || ""}
									placeholder="karim@email.dz"
								/>
								<Input
									name="phone"
									type="tel"
									label={t("phone")}
									defaultValue={selectedStudent?.phone || ""}
									placeholder="0550 00 00 00"
								/>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-amber-50/30 rounded-2xl border border-amber-100/50">
								<div className="md:col-span-2">
                                    <Input
                                        name="parentName"
                                        label={t("parent_name_label")}
                                        defaultValue={selectedStudent?.parentName || ""}
                                        placeholder="Ex: Zidane Mourad"
                                        required
                                    />
                                </div>
                                <Input
                                    name="parentPhone"
                                    label={t("parent_phone_label")}
                                    defaultValue={selectedStudent?.parentPhone || ""}
                                    placeholder="0550 00 00 00"
                                    required
                                />
                                <Input
                                    name="parentEmail"
                                    label={t("parent_email_label")}
                                    defaultValue={selectedStudent?.parentEmail || ""}
                                    placeholder="parent@email.dz"
                                />
							</div>
						)}
					</div>

                    {/* Assignment Section */}
					<div className="space-y-6">
						<div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-line pb-4">
							<Edit3 size={14} />
							{t("students_academic_assignment")}
						</div>

						<MultiSelect
							label={t("students_enroll_groups")}
							placeholder={t("students_groups_placeholder")}
							options={groups.map((g) => ({ label: g.name, value: g.id }))}
							value={selectedGroupIds}
							onChange={setSelectedGroupIds}
						/>
					</div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white border-t border-line mt-10 pb-2">
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setIsModalOpen(false)}
                            className="btn btn--ghost btn--md px-6"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn btn--primary btn--md px-8 shadow-lg shadow-brand-500/10"
                        >
                            {isPending && <Loader2 size={16} className="animate-spin" />}
                            <span>
                                {selectedStudent
                                    ? t("students_confirm_update")
                                    : t("students_confirm_registration")}
                            </span>
                        </button>
                    </div>
				</form>
			</Modal>

            <AnimatePresence>
                {errorMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 z-[100] max-w-md p-5 bg-white rounded-2xl shadow-ts-3 border-l-4 border-danger flex gap-4 items-start"
                    >
                        <div className="p-2 bg-rose-50 rounded-xl text-danger shrink-0">
                            <AlertCircle size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-ink-900 mb-1">Attention</h4>
                            <p className="text-xs text-ink-500 leading-relaxed font-medium">{errorMessage}</p>
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
		</div>
	);
}
