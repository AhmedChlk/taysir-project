"use client";

import { Edit3 } from "lucide-react";
import { useState } from "react";
import type { Group, PaymentPlan, Student } from "@/types/schema";
import StudentFormModal from "./StudentFormModal";

interface EditStudentProfileButtonProps {
	student: Student & { groups: Group[]; paymentPlans: PaymentPlan[] };
	groups: Group[];
}

export default function EditStudentProfileButton({
	student,
	groups,
}: EditStudentProfileButtonProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="btn btn--secondary btn--md px-6 shadow-sm active:scale-95"
			>
				<Edit3 size={18} />
				<span>Modifier le profil</span>
			</button>

			<StudentFormModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				student={student}
				groups={groups}
			/>
		</>
	);
}
