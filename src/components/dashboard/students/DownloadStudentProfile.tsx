"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import type { Group, Student } from "@/types/schema";
import { StudentPdfPreviewModal } from "./StudentPdfPreviewModal";

interface DownloadStudentProfileProps {
	student: Student & { groups: Group[] };
}

/* Opens the in-app PDF preview (with download + print) instead of a blind
   download. The PDF building lives in the shared generator / preview modal. */
export default function DownloadStudentProfile({
	student,
}: DownloadStudentProfileProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
			>
				<Download size={16} />
				<span>Télécharger la fiche</span>
			</button>
			{open && (
				<StudentPdfPreviewModal
					student={student}
					isOpen={open}
					onClose={() => setOpen(false)}
				/>
			)}
		</>
	);
}
