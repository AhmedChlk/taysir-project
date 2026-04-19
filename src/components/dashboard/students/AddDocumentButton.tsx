"use client";

import { Loader2, Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
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
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const _t = useTranslations();
	const router = useRouter();

	const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const file = fileInputRef.current?.files?.[0];

		if (!file) {
			setErrorMessage("Veuillez sélectionner un fichier.");
			return;
		}

		if (!name) {
			setErrorMessage("Veuillez donner un nom au document.");
			return;
		}

		startTransition(async () => {
			// 1. Upload to Vercel Blob
			const uploadData = new FormData();
			uploadData.append("file", file);
			const uploadRes = await uploadFileAction(uploadData);

			if (!uploadRes.success || !uploadRes.data?.url) {
				setErrorMessage(
					uploadRes.error || "Erreur lors de l'upload du fichier",
				);
				return;
			}

			// 2. Save record in database
			const result = await addDocumentToStudentAction({
				studentId,
				name,
				url: uploadRes.data.url,
				type: file.type,
			});

			if (result.success) {
				setIsOpen(false);
				setErrorMessage(null);
				router.refresh();
			} else {
				setErrorMessage(result.error.message || "Une erreur est survenue.");
			}
		});
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
			>
				<Plus size={18} />
				<span className="font-black text-[10px] uppercase tracking-widest">
					Ajouter un document
				</span>
			</button>

			<Modal
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
					setErrorMessage(null);
				}}
				title="Nouveau document"
				footer={
					<>
						<button
							onClick={() => setIsOpen(false)}
							className="btn-ghost font-black text-xs uppercase tracking-widest text-taysir-teal/40"
						>
							Annuler
						</button>
						<button
							form="add-document-form"
							type="submit"
							disabled={isPending}
							className="btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl"
						>
							{isPending && <Loader2 size={16} className="animate-spin" />}
							<span className="font-black text-xs uppercase tracking-widest">
								Téléverser
							</span>
						</button>
					</>
				}
			>
				<form
					id="add-document-form"
					onSubmit={handleUpload}
					className="space-y-6 p-2"
				>
					{errorMessage && (
						<div className="p-3 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
							<Plus size={14} className="rotate-45" />
							{errorMessage}
						</div>
					)}

					<div
						onClick={() => fileInputRef.current?.click()}
						className="w-full py-12 border-2 border-dashed border-taysir-teal/10 rounded-[32px] flex flex-col items-center justify-center gap-4 bg-taysir-bg/30 hover:bg-taysir-teal/5 transition-all cursor-pointer group"
					>
						<div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-taysir-teal group-hover:scale-110 transition-transform">
							<Upload size={32} />
						</div>
						<div className="text-center">
							<p className="text-sm font-black text-taysir-teal uppercase tracking-tight">
								Cliquer pour sélectionner
							</p>
							<p className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest mt-1">
								PDF, JPG, PNG (max 5Mo)
							</p>
						</div>
					</div>

					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept="image/*,application/pdf"
					/>

					<Input
						name="name"
						label="Nom du document"
						placeholder="Ex: Certificat médical, CNI, etc."
						required
					/>
				</form>
			</Modal>
		</>
	);
}
