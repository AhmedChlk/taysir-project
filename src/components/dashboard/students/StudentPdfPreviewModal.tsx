"use client";

import { useCallback } from "react";
import { PdfPreviewModal } from "@/components/ui/PdfPreviewModal";
import { generateStudentProfilePDF } from "@/lib/pdf-generators/student-profile";
import type { Group, Student } from "@/types/schema";
import { loadImageAsDataUrl } from "@/utils/image";

interface StudentPdfPreviewModalProps {
	student: Student & { groups: Group[] };
	isOpen: boolean;
	onClose: () => void;
}

/* Preview the student fiche before download (photo embedded when available). */
export function StudentPdfPreviewModal({
	student,
	isOpen,
	onClose,
}: StudentPdfPreviewModalProps) {
	const build = useCallback(async () => {
		const photo = student.photoUrl
			? await loadImageAsDataUrl(student.photoUrl)
			: null;
		return generateStudentProfilePDF(student, {
			photoDataUrl: photo?.dataUrl ?? null,
		});
	}, [student]);

	return (
		<PdfPreviewModal
			isOpen={isOpen}
			onClose={onClose}
			title={`Aperçu — Fiche de ${student.firstName} ${student.lastName}`}
			fileName={`Fiche_${student.lastName}_${student.firstName}.pdf`}
			build={build}
		/>
	);
}
