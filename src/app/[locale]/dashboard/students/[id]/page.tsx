import type { Prisma } from "@prisma/client";
import {
	ArrowLeft,
	Calendar,
	Clock,
	Eye,
	FileText,
	Mail,
	MapPin,
	Phone,
	User,
	Users,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStudentFullProfileAction } from "@/actions/students.actions";
import type { Group, Student } from "@/types/schema";

type StudentFullProfile = NonNullable<
	Prisma.StudentGetPayload<{
		include: {
			groups: true;
			documents: true;
			attendance: {
				include: { session: { include: { activity: true } } };
			};
			paymentPlans: {
				include: {
					activity: true;
					tranches: { include: { paiements: true } };
				};
			};
		};
	}>
>;

import AddDocumentButton from "@/components/dashboard/students/AddDocumentButton";
import DownloadStudentProfile from "@/components/dashboard/students/DownloadStudentProfile";
import { Link } from "@/i18n/routing";
import { formatFullName } from "@/utils/format";

interface PageProps {
	params: Promise<{ id: string; locale: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
	const { id } = await params;
	const [response, t] = await Promise.all([
		getStudentFullProfileAction({ id }),
		getTranslations(),
	]);

	if (!response.success || !response.data) {
		notFound();
	}

	const student = response.data as StudentFullProfile;

	return (
		<div className="space-y-8 pb-20">
			{/* Header / Back Button */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard/students"
						className="w-12 h-12 rounded-2xl bg-white border border-taysir-teal/5 flex items-center justify-center text-taysir-teal hover:bg-taysir-teal hover:text-white transition-all shadow-sm group"
					>
						<ArrowLeft
							size={24}
							className="group-hover:-translate-x-1 transition-transform"
						/>
					</Link>
					<div>
						<div className="flex items-center gap-2 mb-0.5">
							<span className="text-[10px] font-black tracking-[0.3em] text-taysir-teal/40 uppercase">
								{t("student_academic_file")}
							</span>
							<div className="w-1 h-1 rounded-full bg-taysir-accent animate-pulse" />
						</div>
						<h1 className="text-3xl font-black text-taysir-teal uppercase tracking-tighter leading-none">
							{t("student_profile_title")}
							<span className="text-taysir-accent">.</span>
						</h1>
					</div>
				</div>

				<DownloadStudentProfile
					student={student as unknown as Student & { groups: Group[] }}
				/>
			</div>

			{/* Top Section : Bio & Stats */}
			<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
				<div className="col-span-1 md:col-span-8 bento-card p-8 flex flex-col md:flex-row gap-8 items-center md:items-start bg-gradient-to-br from-white to-taysir-bg/30 relative overflow-hidden">
					<div className="relative w-40 h-40 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl shrink-0 bg-taysir-teal/5 flex items-center justify-center group/photo">
						{student.photoUrl ? (
							<Image
								src={student.photoUrl}
								alt={student.firstName}
								fill
								className="object-cover"
							/>
						) : (
							<User size={80} className="text-taysir-teal/10" />
						)}
						<div className="absolute inset-0 bg-taysir-teal/20 opacity-0 group-hover/photo:opacity-100 transition-opacity" />
					</div>

					<div className="flex-1 text-center md:text-left relative z-10">
						<div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
							<h2 className="text-4xl font-black text-taysir-teal uppercase tracking-tighter leading-none">
								{formatFullName(student.firstName, student.lastName)}
							</h2>
							<span
								className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest self-center md:self-auto border ${
									student.isActive
										? "bg-emerald-50 text-emerald-600 border-emerald-100"
										: "bg-rose-50 text-rose-600 border-rose-100"
								}`}
							>
								{student.isActive
									? t("student_active_file")
									: t("student_inactive_file")}
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mt-6">
							<div className="flex items-center gap-3 text-sm font-bold text-taysir-teal/70">
								<div className="p-2 bg-white rounded-lg shadow-sm">
									<Mail size={16} className="text-taysir-teal/30" />
								</div>
								<span>{student.email || t("student_not_provided")}</span>
							</div>
							<div className="flex items-center gap-3 text-sm font-bold text-taysir-teal/70">
								<div className="p-2 bg-white rounded-lg shadow-sm">
									<Phone size={16} className="text-taysir-teal/30" />
								</div>
								<span>
									{student.isMinor
										? student.parentPhone
										: student.phone || "N/A"}
								</span>
							</div>
							<div className="flex items-center gap-3 text-sm font-bold text-taysir-teal/70">
								<div className="p-2 bg-white rounded-lg shadow-sm">
									<Calendar size={16} className="text-taysir-teal/30" />
								</div>
								<span>
									{t("student_enrolled_on")}{" "}
									{new Date(student.registrationDate).toLocaleDateString()}
								</span>
							</div>
							<div className="flex items-center gap-3 text-sm font-bold text-taysir-teal/70">
								<div className="p-2 bg-white rounded-lg shadow-sm">
									<MapPin size={16} className="text-taysir-teal/30" />
								</div>
								<span className="truncate max-w-[200px]">
									{student.address || t("student_no_address")}
								</span>
							</div>
						</div>

						{student.isMinor && (
							<div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
								<div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm font-black">
									P
								</div>
								<div>
									<p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest leading-none mb-1">
										{t("student_legal_guardian")}
									</p>
									<p className="text-sm font-black text-amber-700 uppercase tracking-tight">
										{student.parentName}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Background decoration */}
					<div className="absolute -right-20 -bottom-20 w-80 h-80 bg-taysir-accent/5 rounded-full blur-[100px]" />
				</div>

				<div className="col-span-1 md:col-span-4 grid grid-cols-1 gap-4">
					<div className="bento-card p-8 bg-taysir-teal text-white border-none relative overflow-hidden group">
						<div className="relative z-10 flex flex-col justify-between h-full">
							<div className="flex justify-between items-start">
								<div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
									<Clock size={24} className="text-taysir-light" />
								</div>
								<span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
									{t("student_sessions_label")}
								</span>
							</div>
							<div className="mt-6">
								<div className="text-5xl font-black tracking-tighter leading-none">
									{student.attendance.length}
								</div>
								<div className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">
									{t("student_attendance_recorded")}
								</div>
							</div>
						</div>
						<div className="absolute -right-8 -bottom-8 opacity-10 scale-150 transition-transform group-hover:rotate-12 duration-1000">
							<Clock size={160} strokeWidth={1} />
						</div>
					</div>

					<div className="bento-card p-8 bg-white border border-taysir-teal/5 relative overflow-hidden group">
						<div className="relative z-10 flex flex-col justify-between h-full">
							<div className="flex justify-between items-start">
								<div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
									<Wallet size={24} />
								</div>
								<span className="text-[10px] font-black uppercase tracking-[0.2em] text-taysir-teal/30">
									{t("student_treasury")}
								</span>
							</div>
							<div className="mt-6">
								<div className="text-4xl font-black text-taysir-teal tracking-tighter leading-none">
									{student.paymentPlans
										.reduce(
											(acc: number, p) => acc + (p.totalAmount - p.paidAmount),
											0,
										)
										.toLocaleString()}{" "}
									<span className="text-sm">DZD</span>
								</div>
								<div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-2">
									{t("student_current_debit")}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mid Section : Documents & Groupes */}
			<div className="grid grid-cols-1 md:grid-cols-12 gap-8">
				{/* Groupes & Affectations */}
				<div className="col-span-1 md:col-span-5 space-y-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-taysir-teal/5 rounded-xl text-taysir-teal">
							<Users size={20} />
						</div>
						<h3 className="text-lg font-black text-taysir-teal uppercase tracking-tighter">
							{t("student_group_enrollments")}
						</h3>
					</div>
					<div className="grid grid-cols-1 gap-3">
						{student.groups.length > 0 ? (
							student.groups.map((group) => (
								<div
									key={group.id}
									className="p-5 bg-white rounded-[24px] border border-taysir-teal/5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
								>
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-taysir-bg flex items-center justify-center text-taysir-teal font-black text-lg group-hover:bg-taysir-teal group-hover:text-white transition-colors">
											{group.name[0]}
										</div>
										<div>
											<div className="text-sm font-black text-taysir-teal uppercase tracking-tight">
												{group.name}
											</div>
											<div className="text-[9px] font-bold text-taysir-teal/30 uppercase tracking-widest">
												{t("student_active_since")}{" "}
												{new Date(group.createdAt).toLocaleDateString()}
											</div>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="py-12 text-center bg-white rounded-[32px] border-2 border-dashed border-taysir-teal/5 opacity-40">
								<Users size={40} className="mx-auto mb-3 text-taysir-teal/20" />
								<p className="text-xs font-black uppercase tracking-widest">
									{t("student_no_groups")}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Documents */}
				<div className="col-span-1 md:col-span-7 space-y-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-taysir-teal/5 rounded-xl text-taysir-teal">
								<FileText size={20} />
							</div>
							<h3 className="text-lg font-black text-taysir-teal uppercase tracking-tighter">
								{t("student_digital_file")}
							</h3>
						</div>
						<AddDocumentButton studentId={student.id} />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{student.documents.length > 0 ? (
							student.documents.map((doc) => (
								<div
									key={doc.id}
									className="p-5 bg-white rounded-[24px] border border-taysir-teal/5 flex items-center justify-between shadow-sm hover:border-taysir-accent/30 transition-all"
								>
									<div className="flex items-center gap-4">
										<div className="p-3 bg-taysir-teal/5 rounded-2xl text-taysir-teal shadow-inner">
											<FileText size={20} />
										</div>
										<div>
											<div className="text-[11px] font-black text-taysir-teal uppercase tracking-tight truncate max-w-[120px]">
												{doc.name}
											</div>
											<div
												className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md mt-1 w-fit ${
													doc.status === "APPROVED"
														? "bg-emerald-50 text-emerald-600"
														: "bg-amber-50 text-amber-600"
												}`}
											>
												{doc.status}
											</div>
										</div>
									</div>
									<a
										href={doc.url}
										target="_blank"
										className="p-2 hover:bg-taysir-teal hover:text-white rounded-xl transition-all text-taysir-teal"
										rel="noopener noreferrer"
									>
										<Eye size={18} />
									</a>
								</div>
							))
						) : (
							<div className="col-span-2 py-16 text-center bg-white rounded-[32px] border-2 border-dashed border-taysir-teal/5 opacity-40">
								<FileText
									size={48}
									className="mx-auto mb-3 text-taysir-teal/20"
								/>
								<p className="text-xs font-black uppercase tracking-widest text-taysir-teal">
									{t("student_no_documents")}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Bottom Section : Attendance History */}
			<div className="space-y-6">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-taysir-teal/5 rounded-xl text-taysir-teal">
						<User size={20} />
					</div>
					<h3 className="text-lg font-black text-taysir-teal uppercase tracking-tighter">
						{t("student_attendance_log")}
					</h3>
				</div>
				<div className="bento-card p-0 overflow-hidden bg-white border border-taysir-teal/5 shadow-xl">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead className="bg-taysir-bg/50 text-[10px] font-black text-taysir-teal/40 uppercase tracking-widest">
								<tr>
									<th className="px-8 py-5">{t("student_date_session")}</th>
									<th className="px-8 py-5">{t("student_module_activity")}</th>
									<th className="px-8 py-5 text-center">
										{t("kpi_engagement")}
									</th>
									<th className="px-8 py-5">{t("student_comments")}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-taysir-teal/5">
								{student.attendance.map((record) => (
									<tr
										key={record.id}
										className="hover:bg-taysir-teal/[0.01] transition-colors group"
									>
										<td className="px-8 py-6">
											<div className="text-sm font-black text-taysir-teal uppercase tracking-tight">
												{new Date(
													record.session.startTime,
												).toLocaleDateString()}
											</div>
											<div className="text-[10px] font-bold text-taysir-teal/30 uppercase tracking-widest mt-1 flex items-center gap-1">
												<Clock size={10} />{" "}
												{new Date(record.session.startTime).toLocaleTimeString(
													[],
													{
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</div>
										</td>
										<td className="px-8 py-6">
											<span className="text-[10px] font-black text-white uppercase tracking-widest bg-taysir-teal px-3 py-1.5 rounded-xl shadow-sm">
												{record.session.activity.name}
											</span>
										</td>
										<td className="px-8 py-6 text-center">
											<span
												className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${
													record.status === "PRESENT"
														? "bg-emerald-50 text-emerald-600 border-emerald-100"
														: record.status === "ABSENT"
															? "bg-rose-50 text-rose-600 border-rose-100"
															: "bg-amber-50 text-amber-600 border-amber-100"
												}`}
											>
												{record.status}
											</span>
										</td>
										<td className="px-8 py-6 text-xs text-taysir-teal/50 font-medium italic">
											{record.note || t("student_no_observation")}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{student.attendance.length === 0 && (
						<div className="py-20 text-center opacity-30">
							<Calendar
								size={64}
								className="mx-auto mb-4 text-taysir-teal/20"
							/>
							<p className="font-black uppercase tracking-[0.3em] text-xs">
								{t("student_empty_history")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
