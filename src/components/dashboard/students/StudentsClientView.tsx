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
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
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

interface StudentsClientViewProps {
	initialStudents: (Student & { groups: Group[] })[];
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
	const [selectedStudent, setSelectedStudent] = useState<
		(Student & { groups: Group[] }) | null
	>(null);
	const [isMinor, setIsMinor] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const t = useTranslations();
	const router = useRouter();

	const handleEdit = (student: Student & { groups: Group[] }) => {
		setSelectedStudent(student);
		setIsMinor(student.isMinor || false);
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
		startTransition(async () => {
			const result = await deleteStudentAction({ id: studentToDelete });
			if (result.success) {
				setIsDeleteModalOpen(false);
				setStudentToDelete(null);
				router.refresh();
			} else {
				setErrorMessage(result.error.message);
			}
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

		// Upload image if provided
		let uploadedPhotoUrl = selectedStudent?.photoUrl || null;
		const file = fileInputRef.current?.files?.[0];

		if (!selectedStudent && !file) {
			setErrorMessage("La photo de l'élève est obligatoire à l'inscription.");
			return;
		}

		if (file) {
			const uploadData = new FormData();
			uploadData.append("file", file);
			const uploadRes = await uploadFileAction(uploadData);
			if (!uploadRes.success || !uploadRes.data?.url) {
				setErrorMessage(
					uploadRes.error || "Erreur lors de l'upload de la photo",
				);
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

		startTransition(async () => {
			let result;
			if (selectedStudent) {
				result = await updateStudentAction({ id: selectedStudent.id, ...data });
			} else {
				result = await createStudentAction(data);
			}

			if (result.success) {
				setIsModalOpen(false);
				setSelectedStudent(null);
				router.refresh();
			} else {
				alert(result.error.message || "Une erreur est survenue.");
			}
		});
	};

	const handleDownloadPDF = (student: Student & { groups: Group[] }) => {
		try {
			const doc = generateStudentProfilePDF(student);
			doc.save(`Fiche_${student.lastName}_${student.firstName}.pdf`);
			setPdfError(null);
		} catch (error) {
			console.error("PDF Generation failed", error);
			setPdfError("Erreur lors de la génération du PDF. Veuillez réessayer.");
		}
	};

	const columns = [
		{
			header: "Identité",
			accessor: (student: Student) => (
				<div className="flex items-center gap-4">
					<div className="relative w-12 h-12 rounded-[18px] overflow-hidden border-2 border-white shadow-sm shrink-0 bg-taysir-teal/5 flex items-center justify-center">
						{student.photoUrl ? (
							<Image
								src={student.photoUrl}
								alt={student.firstName}
								fill
								className="object-cover"
							/>
						) : (
							<User size={24} className="text-taysir-teal/20" />
						)}
					</div>
					<div className="flex flex-col">
						<span className="font-black text-taysir-teal uppercase tracking-tight text-sm leading-tight">
							{formatFullName(student.firstName, student.lastName)}
						</span>
						<div className="flex items-center gap-1.5 mt-0.5">
							{student.isMinor && (
								<span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-black uppercase border border-amber-200">
									Mineur
								</span>
							)}
							<span className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest">
								Inscrit le{" "}
								{new Date(student.registrationDate).toLocaleDateString()}
							</span>
						</div>
					</div>
				</div>
			),
		},
		{
			header: "Contact",
			accessor: (student: Student) => (
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-xs font-bold text-taysir-teal/70">
						<Phone size={12} className="text-taysir-teal/30" />
						<span>
							{student.isMinor ? student.parentPhone : student.phone || "N/A"}
						</span>
					</div>
					{student.email && (
						<div className="flex items-center gap-2 text-[10px] font-medium text-taysir-teal/40">
							<Mail size={12} className="text-taysir-teal/20" />
							<span>{student.email}</span>
						</div>
					)}
				</div>
			),
		},
		{
			header: "Affectation",
			accessor: (student: Student & { groups: Group[] }) => (
				<div className="flex flex-wrap gap-1">
					{student.groups.length > 0 ? (
						student.groups.map((g) => (
							<span
								key={g.id}
								className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black uppercase border border-blue-100"
							>
								{g.name}
							</span>
						))
					) : (
						<span className="text-[10px] italic text-gray-300 font-bold uppercase">
							Aucun groupe
						</span>
					)}
				</div>
			),
		},
		{
			header: t("status_header"),
			accessor: (student: Student) => (
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
						student.isActive
							? "bg-emerald-50 text-emerald-600 border border-emerald-100"
							: "bg-rose-50 text-rose-600 border border-rose-100"
					}`}
				>
					<div
						className={`w-1.5 h-1.5 rounded-full me-1.5 ${student.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
					/>
					{student.isActive ? t("active") : t("inactive")}
				</span>
			),
		},
		{
			header: "",
			accessor: (student: Student & { groups: Group[] }) => (
				<div className="flex justify-end pr-2">
					<DropdownMenu
						items={[
							{
								label: "Voir la fiche",
								icon: <Eye size={14} />,
								href: `/dashboard/students/${student.id}`,
							},
							{
								label: "Télécharger la fiche",
								icon: <Download size={14} />,
								onClick: () => handleDownloadPDF(student),
							},
							{
								label: "Modifier",
								icon: <Edit3 size={14} />,
								onClick: () => handleEdit(student),
							},
							{
								label: "Supprimer",
								icon: <Trash2 size={14} />,
								variant: "danger",
								onClick: () => handleDelete(student.id),
							},
						]}
					/>
				</div>
			),
			className: "w-10 text-end",
		},
	];

	return (
		<div className="space-y-10 pb-20 pt-16">
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div>
					<h1 className="text-3xl font-black text-taysir-teal uppercase tracking-tighter leading-none">
						Gestion des inscriptions
						<span className="text-taysir-accent">.</span>
					</h1>
					<p className="text-sm text-taysir-teal/50 mt-2 font-medium">
						Inscrivez, gérez et suivez l&apos;évolution de vos apprenants.
					</p>
				</div>
			</div>

			{pdfError && (
				<p className="text-red-500 text-sm font-medium">{pdfError}</p>
			)}

			<DataTable
				data={initialStudents}
				columns={columns}
				searchPlaceholder="Rechercher un élève par nom, email ou groupe..."
				onAdd={handleAdd}
				hideDefaultAction={true}
			/>

			<ConfirmModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
				title="Supprimer l'élève"
				message="Êtes-vous sûr de vouloir supprimer cet élève ? Cette action supprimera également tous les paiements et documents associés. Cette action est irréversible."
				confirmLabel="Supprimer"
				variant="danger"
				isLoading={isPending}
			/>

			<Modal
				isOpen={!!errorMessage}
				onClose={() => setErrorMessage(null)}
				title="Attention"
				footer={
					<button
						onClick={() => setErrorMessage(null)}
						className="btn-primary px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest"
					>
						Compris
					</button>
				}
			>
				<div className="flex flex-col items-center gap-4 py-4 text-center">
					<div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
						<AlertCircle size={32} />
					</div>
					<p className="text-gray-600 font-medium">{errorMessage}</p>
				</div>
			</Modal>

			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedStudent(null);
				}}
				title={
					selectedStudent ? "Mise à jour dossier" : "Inscription nouvel élève"
				}
				footer={
					<>
						<button
							disabled={isPending}
							onClick={() => setIsModalOpen(false)}
							className="btn-ghost font-black text-xs uppercase tracking-widest text-taysir-teal/40"
						>
							{t("cancel")}
						</button>
						<button
							form="student-form"
							type="submit"
							disabled={isPending}
							className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl"
						>
							{isPending && <Loader2 size={16} className="animate-spin" />}
							<span className="font-black text-xs uppercase tracking-widest">
								{selectedStudent
									? "Valider les modifications"
									: "Confirmer l'inscription"}
							</span>
						</button>
					</>
				}
			>
				<form
					id="student-form"
					onSubmit={handleSubmit}
					className="space-y-8 p-2"
				>
					<div className="flex flex-col items-center gap-6">
						<div className="relative group">
							<div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-taysir-bg flex items-center justify-center relative">
								{photoPreview ? (
									<Image
										src={photoPreview}
										alt="Preview"
										fill
										className="object-cover"
									/>
								) : (
									<User size={64} className="text-taysir-teal/10" />
								)}
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="absolute inset-0 bg-taysir-teal/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
								>
									<Camera size={32} />
								</button>
							</div>
							<input
								type="file"
								ref={fileInputRef}
								className="hidden"
								accept="image/*"
								onChange={handlePhotoChange}
							/>
							<p className="text-[10px] font-black text-center mt-3 text-taysir-teal/40 uppercase tracking-widest">
								Portrait Étudiant
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
							<Input
								name="firstName"
								label="Prénom"
								defaultValue={selectedStudent?.firstName}
								placeholder="Ex: Karim"
								required
							/>
							<Input
								name="lastName"
								label="Nom"
								defaultValue={selectedStudent?.lastName}
								placeholder="Ex: Zidane"
								required
							/>
						</div>
					</div>

					<div className="flex items-center justify-between p-5 bg-gradient-to-r from-taysir-teal/5 to-transparent rounded-3xl border border-taysir-teal/5">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-white rounded-xl shadow-sm text-taysir-teal">
								<Baby size={20} />
							</div>
							<div>
								<span className="text-sm font-black text-taysir-teal uppercase tracking-tight block leading-none">
									Élève Mineur
								</span>
								<span className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest">
									Active les coordonnées parents
								</span>
							</div>
						</div>
						<Toggle enabled={isMinor} onChange={setIsMinor} />
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2 mb-2">
							<ShieldCheck size={16} className="text-taysir-accent" />
							<h3 className="text-xs font-black text-taysir-teal uppercase tracking-widest">
								Coordonnées de contact
							</h3>
						</div>

						{!isMinor ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input
									name="email"
									type="email"
									label="Email"
									defaultValue={selectedStudent?.email || ""}
									placeholder="karim@email.dz"
								/>
								<Input
									name="phone"
									type="tel"
									label="Téléphone"
									defaultValue={selectedStudent?.phone || ""}
									placeholder="0550 00 00 00"
								/>
							</div>
						) : (
							<div className="space-y-4 p-5 bg-amber-50/50 rounded-3xl border border-amber-100/50">
								<Input
									name="parentName"
									label="Nom complet du Parent / Tuteur"
									defaultValue={selectedStudent?.parentName || ""}
									placeholder="Ex: Zidane Mourad"
									required
								/>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Input
										name="parentPhone"
										label="Téléphone parent"
										defaultValue={selectedStudent?.parentPhone || ""}
										placeholder="0550 00 00 00"
										required
									/>
									<Input
										name="parentEmail"
										label="Email parent"
										defaultValue={selectedStudent?.parentEmail || ""}
										placeholder="parent@email.dz"
									/>
								</div>
							</div>
						)}

						<div className="relative">
							<TextArea
								name="address"
								label="Adresse de résidence"
								defaultValue={selectedStudent?.address || ""}
								placeholder="Ex: Cité 1200 logements, Bat 12, Alger"
							/>
							<MapPin
								size={16}
								className="absolute right-4 top-10 text-taysir-teal/20"
							/>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2 mb-2">
							<Edit3 size={16} className="text-taysir-accent" />
							<h3 className="text-xs font-black text-taysir-teal uppercase tracking-widest">
								Affectation Académique
							</h3>
						</div>

						<MultiSelect
							label="Inscrire aux Groupes"
							placeholder="Sélectionner un ou plusieurs groupes..."
							options={groups.map((g) => ({ label: g.name, value: g.id }))}
							value={selectedGroupIds}
							onChange={setSelectedGroupIds}
						/>
					</div>
				</form>
			</Modal>
		</div>
	);
}
