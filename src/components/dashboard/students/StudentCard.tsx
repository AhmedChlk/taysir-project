import { clsx } from "clsx";
import {
	Download,
	Edit3,
	Eye,
	Phone,
	Trash2,
	User,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { Link } from "@/i18n/routing";
import { niveauShort } from "@/lib/niveaux";
import type { Group, PaymentPlan, Student } from "@/types/schema";
import { formatFullName } from "@/utils/format";

type StudentWithGroups = Student & {
	groups: Group[];
	paymentPlans: PaymentPlan[];
};

interface StudentCardProps {
	student: StudentWithGroups;
	onEdit: (student: StudentWithGroups) => void;
	onDelete: (id: string) => void;
	onDownloadPDF: (student: StudentWithGroups) => void;
}

export default function StudentCard({
	student,
	onEdit,
	onDelete,
	onDownloadPDF,
}: StudentCardProps) {
	const t = useTranslations();
	const totalDue =
		student.paymentPlans?.reduce(
			(acc, p) => acc + (p.totalAmount - p.paidAmount),
			0,
		) || 0;

	return (
		<div className="bg-white rounded-[24px] border border-line p-6 shadow-sm hover:shadow-ts-2 transition-all group relative overflow-hidden">
			<div className="flex justify-between items-start mb-6">
				<div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-ts-1 shrink-0 bg-surface-100 flex items-center justify-center">
					{student.photoUrl ? (
						<Image
							src={student.photoUrl}
							alt={student.firstName}
							fill
							className="object-cover group-hover:scale-110 transition-transform duration-500"
						/>
					) : (
						<User size={32} className="text-ink-200" />
					)}
				</div>
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
							onClick: () => onDownloadPDF(student),
						},
						{
							label: t("student_edit"),
							icon: <Edit3 size={14} />,
							onClick: () => onEdit(student),
						},
						{
							label: t("delete"),
							icon: <Trash2 size={14} />,
							variant: "danger",
							onClick: () => onDelete(student.id),
						},
					]}
				/>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-bold text-ink-900 truncate tracking-tight">
						{formatFullName(student.firstName, student.lastName)}
					</h3>
					<div className="flex items-center gap-2 mt-1">
						<span
							className={clsx(
								"inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border",
								student.isActive
									? "bg-success-50 text-success border-success/10"
									: "bg-rose-50 text-danger border-danger/10",
							)}
						>
							{student.isActive ? t("active") : t("inactive")}
						</span>
						{student.isMinor && (
							<span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-widest border border-amber-200/50">
								{t("student_minor")}
							</span>
						)}
						{student.niveau && (
							<span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[9px] font-bold uppercase tracking-widest border border-brand-200/50">
								{niveauShort(student.niveau)}
							</span>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-3 text-xs font-bold text-ink-700">
						<div className="p-1.5 bg-surface-50 rounded-lg text-ink-400">
							<Phone size={14} />
						</div>
						<span className="tabular-nums">
							{student.isMinor ? student.parentPhone : student.phone || "—"}
						</span>
					</div>
					<div className="flex items-center gap-3 text-xs font-bold text-ink-700">
						<div className="p-1.5 bg-surface-50 rounded-lg text-ink-400">
							<Wallet size={14} />
						</div>
						<span
							className={clsx(
								"tabular-nums",
								totalDue > 0 ? "text-danger" : "text-success",
							)}
						>
							{totalDue.toLocaleString()} DA
						</span>
					</div>
				</div>

				<div className="pt-4 border-t border-line flex flex-wrap gap-1.5">
					{student.groups.length > 0 ? (
						student.groups.slice(0, 2).map((g) => (
							<span
								key={g.id}
								className="px-2 py-1 rounded-lg bg-brand-50 text-brand-900 text-[9px] font-bold uppercase tracking-wider border border-brand-100"
							>
								{g.name}
							</span>
						))
					) : (
						<span className="text-[9px] font-bold text-ink-300 uppercase tracking-widest italic">
							{t("students_no_group")}
						</span>
					)}
					{student.groups.length > 2 && (
						<span className="px-2 py-1 rounded-lg bg-surface-50 text-ink-400 text-[9px] font-bold">
							+{student.groups.length - 2}
						</span>
					)}
				</div>
			</div>

			<Link
				href={`/dashboard/students/${student.id}`}
				className="absolute inset-0 z-0 cursor-pointer"
				aria-label={t("student_view_file")}
			/>
		</div>
	);
}
