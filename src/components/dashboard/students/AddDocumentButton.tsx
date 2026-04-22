"use client";

import { FileText, Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { addDocumentToStudentAction } from "@/actions/students.actions";
import { uploadFileAction } from "@/actions/upload.actions";
import { Input } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { useRouter } from "@/i18n/routing";

interface AddDocumentButtonProps {
	studentId: string;
}

export default function AddDocumentButton({
	studentId,
}: AddDocumentButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const t = useTranslations();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const formData = new FormData(e.currentTarget);
		const file = formData.get("file") as File;

		if (!file || file.size === 0) {
			setError("Veuillez sélectionner un fichier.");
			return;
		}

		startTransition(async () => {
			// 1. Upload file
			const uploadData = new FormData();
			uploadData.append("file", file);
			const uploadRes = await uploadFileAction(uploadData);

			if (!uploadRes.success || !uploadRes.data?.url) {
				setError(uploadRes.error || "Erreur lors de l'envoi du fichier.");
				return;
			}

			// 2. Create document record
			const res = await addDocumentToStudentAction({
				studentId,
				name: formData.get("name") as string,
				url: uploadRes.data.url,
				type: file.type,
			});

			if (res.success) {
				setIsOpen(false);
				router.refresh();
			} else {
				setError(res.error.message);
			}
		});
	};

	return (
		<>
			<button
				type="button"
				onClick={() => {
					setError(null);
					setIsOpen(true);
				}}
				className="btn btn--secondary btn--md px-5 h-11"
			>
				<Plus size={16} strokeWidth={2.5} />
				<span>Ajouter un document</span>
			</button>

			<Modal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				title="Nouveau document"
			>
				<form onSubmit={handleSubmit} className="space-y-8 pb-4">
					{error && (
						<div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-danger text-xs font-bold flex items-center gap-3">
							<X size={14} className="shrink-0" />
							{error}
						</div>
					)}

					<div className="space-y-6">
						<Input
							label="Nom du document"
							name="name"
							placeholder="ex: Certificat Médical, Dossier Inscription..."
							required
						/>

						<div className="space-y-2">
							<label className="text-sm font-bold text-ink-700 uppercase tracking-wide">
								Fichier (PDF, Image)
							</label>
							<div className="relative group">
								<input
									type="file"
									name="file"
									required
									accept=".pdf,image/*"
									className="block w-full text-sm text-ink-500
                                        file:mr-4 file:py-2.5 file:px-4
                                        file:rounded-xl file:border-0
                                        file:text-xs file:font-bold file:uppercase file:tracking-widest
                                        file:bg-brand-50 file:text-brand-700
                                        hover:file:bg-brand-100
                                        cursor-pointer bg-surface-50 rounded-2xl border border-dashed border-line p-4 transition-all hover:border-brand-500/30"
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-6 border-t border-line">
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="btn btn--ghost btn--md"
						>
							{t("cancel")}
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="btn btn--primary btn--md px-8 shadow-lg shadow-brand-500/10 min-w-[140px]"
						>
							{isPending ? (
								<Loader2 size={18} className="animate-spin" />
							) : (
								"Enregistrer"
							)}
						</button>
					</div>
				</form>
			</Modal>
		</>
	);
}
