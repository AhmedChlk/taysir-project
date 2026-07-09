"use client";

import type { NiveauScolaire } from "@prisma/client";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	Baby,
	Camera,
	Edit3,
	Loader2,
	Plus,
	ShieldCheck,
	User,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import {
	createStudentAction,
	updateStudentAction,
} from "@/actions/students.actions";
import { uploadFileAction } from "@/actions/upload.actions";
import { Input } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import MultiSelect from "@/components/ui/MultiSelect";
import { useRouter } from "@/i18n/routing";
import { niveauxByCycle } from "@/lib/niveaux";
import type { Group, PaymentPlan, Student } from "@/types/schema";

type StudentWithGroups = Student & {
	groups: Group[];
	paymentPlans: PaymentPlan[];
};

interface StudentFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	student?: StudentWithGroups | null;
	groups: Group[];
}

export default function StudentFormModal({
	isOpen,
	onClose,
	student,
	groups,
}: StudentFormModalProps) {
	const [isPending, startTransition] = useTransition();
	const [isMinor, setIsMinor] = useState(!!student?.isMinor);
	const [photoPreview, setPhotoPreview] = useState<string | null>(
		student?.photoUrl || null,
	);
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
		student?.groups?.map((g) => g.id) || [],
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();

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

		let uploadedPhotoUrl = student?.photoUrl || null;
		const file = fileInputRef.current?.files?.[0];

		if (!student && !file) {
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
			niveau: ((formData.get("niveau") as string) ||
				null) as NiveauScolaire | null,
			groupIds: selectedGroupIds,
		};

		startTransition(async () => {
			let result;
			if (student) {
				result = await updateStudentAction({ id: student.id, ...data });
			} else {
				result = await createStudentAction(data);
			}

			if (result.success) {
				onClose();
				router.refresh();
			} else {
				setErrorMessage(result.error.message || t("error_generic"));
			}
		});
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={
				student ? t("students_update_file") : t("students_new_registration")
			}
			size="xl"
		>
			<form onSubmit={handleSubmit} className="space-y-8">
				{/* Photo — centrée, dans le flux normal (plus d'absolu qui chevauche). */}
				<div className="flex justify-center">
					<motion.div
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="relative group/photo"
					>
						<div className="w-28 h-28 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-brand-500/10 border border-line overflow-hidden relative">
							<div className="w-full h-full rounded-[2rem] bg-surface-50 flex items-center justify-center overflow-hidden border border-dashed border-ink-200 group-hover/photo:border-brand-500 transition-all duration-500 shadow-inner relative">
								{photoPreview ? (
									<Image
										src={photoPreview}
										alt="Preview"
										fill
										className="object-cover transition-transform duration-700 group-hover/photo:scale-110"
									/>
								) : (
									<div className="flex flex-col items-center gap-2 text-ink-300 group-hover/photo:text-brand-500 transition-colors">
										<Camera size={32} strokeWidth={1.5} />
									</div>
								)}
							</div>
						</div>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="absolute -right-2 -bottom-2 p-3 bg-brand-500 text-white rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all hover:scale-110 active:scale-95 z-20"
						>
							<Plus size={20} strokeWidth={2.5} />
						</button>
						<input
							type="file"
							ref={fileInputRef}
							onChange={handlePhotoChange}
							accept="image/*"
							className="hidden"
						/>
					</motion.div>
				</div>

				<div className="space-y-8">
					{/* Statut — segmenté pleine largeur : choix clair, aucune troncature. */}
					<div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-100 p-1.5">
						<button
							type="button"
							onClick={() => setIsMinor(false)}
							className={clsx(
								"flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98]",
								!isMinor
									? "bg-white text-ink-900 shadow-sm"
									: "text-ink-400 hover:text-ink-600",
							)}
						>
							<User size={16} />
							{t("student_adult")}
						</button>
						<button
							type="button"
							onClick={() => setIsMinor(true)}
							className={clsx(
								"flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98]",
								isMinor
									? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
									: "text-ink-400 hover:text-ink-600",
							)}
						>
							<Baby size={16} />
							{t("students_minor_label")}
						</button>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
						{/* Colonne gauche : Identité + Contact / Tuteur */}
						<motion.div
							initial={{ x: -20, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							transition={{ delay: 0.1 }}
							className="space-y-8"
						>
							<div className="space-y-6">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
										<Edit3 size={16} />
									</div>
									<h3 className="text-sm font-black text-ink-900 uppercase tracking-[0.15em]">
										{t("students_identity")}
									</h3>
								</div>

								<div className="grid grid-cols-2 gap-5">
									<Input
										label={t("first_name")}
										name="firstName"
										defaultValue={student?.firstName}
										required
										placeholder="Amine"
									/>
									<Input
										label={t("last_name")}
										name="lastName"
										defaultValue={student?.lastName}
										required
										placeholder="Benali"
									/>
									<div className="col-span-2">
										<Input
											label={t("address")}
											name="address"
											defaultValue={student?.address || ""}
											placeholder="Cité 1200 logts, Bat B..."
										/>
									</div>
								</div>
							</div>

							<AnimatePresence mode="wait">
								{isMinor ? (
									<motion.div
										key="minor-fields"
										initial={{ opacity: 0, y: 10, scale: 0.98 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: -10, scale: 0.98 }}
										className="space-y-6"
									>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
												<ShieldCheck size={16} />
											</div>
											<h3 className="text-sm font-black text-ink-900 uppercase tracking-[0.15em]">
												{t("student_guardian_info")}
											</h3>
										</div>
										<div className="grid grid-cols-2 gap-5">
											<div className="col-span-2">
												<Input
													label={t("student_guardian_name")}
													name="parentName"
													defaultValue={student?.parentName || ""}
													required
													placeholder="Nom du parent / tuteur"
												/>
											</div>
											<Input
												label={t("student_guardian_phone")}
												name="parentPhone"
												defaultValue={student?.parentPhone || ""}
												required
												placeholder="05xx xx xx xx"
											/>
											<Input
												label={t("student_guardian_email")}
												name="parentEmail"
												type="email"
												defaultValue={student?.parentEmail || ""}
												placeholder="parent@email.com"
											/>
										</div>
									</motion.div>
								) : (
									<motion.div
										key="adult-fields"
										initial={{ opacity: 0, y: 10, scale: 0.98 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: -10, scale: 0.98 }}
										className="space-y-6"
									>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
												<ShieldCheck size={16} />
											</div>
											<h3 className="text-sm font-black text-ink-900 uppercase tracking-[0.15em]">
												{t("students_contact")}
											</h3>
										</div>
										<div className="grid grid-cols-2 gap-5">
											<Input
												label={t("email")}
												name="email"
												type="email"
												defaultValue={student?.email || ""}
												placeholder="amine@benali.dz"
											/>
											<Input
												label={t("phone")}
												name="phone"
												defaultValue={student?.phone || ""}
												placeholder="05xx xx xx xx"
											/>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>

						{/* Colonne droite : Affectation académique */}
						<motion.div
							initial={{ x: 20, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<div className="p-8 bg-surface-50 rounded-[32px] border border-line space-y-6">
								<div className="flex items-center gap-3">
									<div className="w-1.5 h-5 bg-brand-500 rounded-full" />
									<h3 className="text-xs font-black text-ink-900 uppercase tracking-widest">
										{t("students_academic_assignment")}
									</h3>
								</div>
								<div>
									<label
										htmlFor="niveau"
										className="mb-1.5 block text-sm font-bold text-ink-700"
									>
										{t("students_niveau")}
									</label>
									<select
										id="niveau"
										name="niveau"
										defaultValue={student?.niveau ?? ""}
										className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
									>
										<option value="">{t("students_niveau_none")}</option>
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
								</div>
								<MultiSelect
									label={t("students_enroll_groups")}
									options={groups.map((g) => ({ label: g.name, value: g.id }))}
									value={selectedGroupIds}
									onChange={setSelectedGroupIds}
									placeholder={t("students_groups_placeholder")}
								/>
							</div>
						</motion.div>
					</div>

					{/* Action Footer */}
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.3 }}
						className="pt-10 border-t border-line flex items-center justify-between"
					>
						<button
							type="button"
							onClick={onClose}
							className="h-14 px-8 text-sm font-bold text-ink-500 hover:text-ink-900 hover:bg-surface-50 rounded-2xl transition-all active:scale-95"
						>
							{t("cancel")}
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="h-14 px-10 bg-ink-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 transition-all hover:bg-brand-500 hover:shadow-2xl hover:shadow-brand-500/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
						>
							{isPending ? (
								<Loader2 size={20} className="animate-spin" />
							) : (
								<Plus
									size={20}
									className="group-hover:rotate-90 transition-transform duration-500"
								/>
							)}
							{student
								? t("students_confirm_update")
								: t("students_confirm_registration")}
						</button>
					</motion.div>
				</div>
			</form>

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
		</Modal>
	);
}
