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
    Download,
    ChevronRight,
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
import { formatFullName, formatDate, formatTime } from "@/utils/format";
import { clsx } from "clsx";

interface PageProps {
	params: Promise<{ id: string; locale: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
	const { id, locale } = await params;
	const [response, t] = await Promise.all([
		getStudentFullProfileAction({ id }),
		getTranslations(),
	]);

	if (!response.success || !response.data) {
		notFound();
	}

	const student = response.data as StudentFullProfile;
    const totalRemaining = student.paymentPlans.reduce(
        (acc: number, p) => acc + (p.totalAmount - p.paidAmount),
        0
    );

	return (
		<div className="space-y-10 pb-24 pt-4 font-sans antialiased">
			{/* Breadcrumbs & Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div className="flex items-center gap-5">
					<Link
						href="/dashboard/students"
						className="w-12 h-12 rounded-2xl bg-white border border-line flex items-center justify-center text-ink-400 hover:text-brand-500 hover:border-brand-500/20 hover:shadow-sm transition-all group shrink-0"
					>
						<ArrowLeft
							size={20}
							className="group-hover:-translate-x-1 transition-transform"
						/>
					</Link>
					<div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-ink-400 uppercase">
                                Dossier Académique
                            </span>
                            <ChevronRight size={10} className="text-ink-300" />
                            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-500 uppercase">
                                Profil Étudiant
                            </span>
                        </div>
						<h1 className="text-3xl font-bold text-ink-900 tracking-tight leading-none">
							{formatFullName(student.firstName, student.lastName)}
						</h1>
					</div>
				</div>

                <div className="flex gap-3">
                    <DownloadStudentProfile
                        student={student as unknown as Student & { groups: Group[] }}
                    />
                </div>
			</div>

			{/* Main Bio Card */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				<div className="col-span-1 lg:col-span-8 bg-white rounded-[24px] border border-line p-8 md:p-10 shadow-sm relative overflow-hidden group">
					<div className="relative z-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
						<div className="relative w-44 h-44 rounded-[40px] overflow-hidden border-4 border-white shadow-ts-3 shrink-0 bg-surface-100 flex items-center justify-center">
							{student.photoUrl ? (
								<Image
									src={student.photoUrl}
									alt={student.firstName}
									fill
									className="object-cover"
								/>
							) : (
								<User size={80} className="text-ink-200" />
							)}
						</div>

						<div className="flex-1 text-center md:text-left">
							<div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
								<h2 className="text-4xl font-bold text-ink-900 tracking-tight leading-none">
									{formatFullName(student.firstName, student.lastName)}
								</h2>
								<span
									className={clsx(
                                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shrink-0",
                                        student.isActive
                                            ? "bg-success-50 text-success border-success/10"
                                            : "bg-rose-50 text-danger border-danger/10"
                                    )}
								>
									{student.isActive ? "Dossier Actif" : "Dossier Inactif"}
								</span>
                                {student.isMinor && (
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                                        Étudiant Mineur
                                    </span>
                                )}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-10">
								<div className="flex items-center gap-4 text-sm font-semibold text-ink-700">
									<div className="p-2.5 bg-surface-50 rounded-xl border border-line text-ink-400">
										<Mail size={18} />
									</div>
									<span className="truncate">{student.email || "—"}</span>
								</div>
								<div className="flex items-center gap-4 text-sm font-semibold text-ink-700">
									<div className="p-2.5 bg-surface-50 rounded-xl border border-line text-ink-400">
										<Phone size={18} />
									</div>
									<span className="tabular-nums">
										{student.isMinor ? student.parentPhone : student.phone || "—"}
									</span>
								</div>
								<div className="flex items-center gap-4 text-sm font-semibold text-ink-700">
									<div className="p-2.5 bg-surface-50 rounded-xl border border-line text-ink-400">
										<Calendar size={18} />
									</div>
									<span>Inscrit le {formatDate(student.registrationDate, locale)}</span>
								</div>
								<div className="flex items-center gap-4 text-sm font-semibold text-ink-700">
									<div className="p-2.5 bg-surface-50 rounded-xl border border-line text-ink-400">
										<MapPin size={18} />
									</div>
									<span className="truncate line-clamp-1">{student.address || "Adresse non saisie"}</span>
								</div>
							</div>

							{student.isMinor && (
								<div className="mt-10 p-5 bg-amber-50/30 rounded-[20px] border border-amber-200/50 flex items-center gap-5">
									<div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 font-bold shrink-0">
										P
									</div>
									<div className="overflow-hidden">
										<p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest leading-none mb-1.5">
											Responsable Légal
										</p>
										<p className="text-base font-bold text-ink-900 truncate">
											{student.parentName}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Decorative Filigree */}
					<div className="absolute -right-16 -bottom-16 opacity-5 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000">
						<User size={280} strokeWidth={1} />
					</div>
				</div>

				<div className="col-span-1 lg:col-span-4 grid grid-cols-1 gap-6">
					<div className="bg-brand-900 rounded-[24px] p-8 text-white relative overflow-hidden shadow-ts-3 group">
						<div className="relative z-10 flex flex-col justify-between h-full">
							<div className="flex justify-between items-start">
								<div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-white">
									<Clock size={24} />
								</div>
								<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
									Assiduité
								</span>
							</div>
							<div className="mt-8">
								<div className="text-5xl font-bold tracking-tighter leading-none tabular-nums">
									{student.attendance.length}
								</div>
								<div className="text-[10px] font-bold uppercase tracking-widest text-brand-300 mt-2">
									Présences validées
								</div>
							</div>
						</div>
						<div className="absolute -right-8 -bottom-8 opacity-10 scale-150 transition-transform group-hover:rotate-12 duration-1000">
							<Clock size={160} strokeWidth={1} />
						</div>
					</div>

					<div className="bg-white rounded-[24px] border border-line p-8 relative overflow-hidden shadow-sm group hover:shadow-ts-2 transition-all">
						<div className="relative z-10 flex flex-col justify-between h-full">
							<div className="flex justify-between items-start">
								<div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-danger shadow-sm">
									<Wallet size={24} />
								</div>
								<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">
									Trésorerie
								</span>
							</div>
							<div className="mt-8">
								<div className="text-4xl font-bold text-ink-900 tracking-tighter leading-none tabular-nums flex items-baseline gap-2">
									{totalRemaining.toLocaleString("fr-DZ")}
									<span className="text-lg text-ink-400 opacity-40">DA</span>
								</div>
								<div className={clsx(
                                    "text-[10px] font-bold uppercase tracking-widest mt-2",
                                    totalRemaining > 0 ? "text-danger" : "text-success"
                                )}>
									Solde débiteur actuel
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Detailed Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
				{/* Column 1: Groups & Docs */}
				<div className="col-span-1 lg:col-span-5 space-y-10">
					{/* Groupes */}
					<div className="space-y-6">
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-brand-50 rounded-xl text-brand-500 border border-brand-100">
								<Users size={18} strokeWidth={2.5} />
							</div>
							<h3 className="text-lg font-bold text-ink-900 tracking-tight uppercase tracking-wide">
								Inscriptions Groupes
							</h3>
						</div>
						<div className="flex flex-col gap-3">
							{student.groups.length > 0 ? (
								student.groups.map((group) => (
									<div
										key={group.id}
										className="p-5 bg-white rounded-2xl border border-line flex items-center justify-between shadow-sm hover:border-brand-500/20 hover:shadow-md transition-all group"
									>
										<div className="flex items-center gap-4">
											<div className="w-12 h-12 rounded-xl bg-surface-50 border border-line flex items-center justify-center text-brand-900 font-bold text-lg group-hover:bg-brand-500 group-hover:text-white transition-all">
												{group.name[0]}
											</div>
											<div>
												<div className="text-sm font-bold text-ink-900">
													{group.name}
												</div>
												<div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mt-0.5">
													Depuis le {formatDate(group.createdAt, locale)}
												</div>
											</div>
										</div>
									</div>
								))
							) : (
								<div className="py-12 text-center bg-surface-50 rounded-[32px] border-2 border-dashed border-line opacity-60">
									<Users size={32} className="mx-auto mb-3 text-ink-200" />
									<p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
										Aucun groupe affecté
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Documents */}
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2.5 bg-brand-50 rounded-xl text-brand-500 border border-brand-100">
									<FileText size={18} strokeWidth={2.5} />
								</div>
								<h3 className="text-lg font-bold text-ink-900 tracking-tight uppercase tracking-wide">
									Dossier Numérique
								</h3>
							</div>
							<AddDocumentButton studentId={student.id} />
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{student.documents.length > 0 ? (
								student.documents.map((doc) => (
									<div
										key={doc.id}
										className="p-5 bg-white rounded-2xl border border-line flex items-center justify-between shadow-sm hover:border-brand-500/20 transition-all group/doc"
									>
										<div className="flex items-center gap-4 overflow-hidden">
											<div className="p-3 bg-surface-50 rounded-xl text-brand-500 border border-line shadow-inner group-hover/doc:bg-brand-50 transition-colors">
												<FileText size={18} />
											</div>
											<div className="overflow-hidden">
												<div className="text-[11px] font-bold text-ink-900 truncate">
													{doc.name}
												</div>
												<div className={clsx(
                                                    "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md mt-1 w-fit border",
                                                    doc.status === "APPROVED" 
                                                        ? "bg-success-50 text-success border-success/10" 
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
													{doc.status}
												</div>
											</div>
										</div>
										<a
											href={doc.url}
											target="_blank"
											className="p-2.5 text-ink-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-brand-500/20"
											rel="noopener noreferrer"
										>
											<Eye size={18} />
										</a>
									</div>
								))
							) : (
								<div className="col-span-full py-16 text-center bg-surface-50 rounded-[32px] border-2 border-dashed border-line opacity-60">
									<FileText
										size={40}
										className="mx-auto mb-3 text-ink-200"
									/>
									<p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
										Aucune pièce jointe
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Column 2: History & Logs */}
				<div className="col-span-1 lg:col-span-7 space-y-6">
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-brand-50 rounded-xl text-brand-500 border border-brand-100">
							<Clock size={18} strokeWidth={2.5} />
						</div>
						<h3 className="text-lg font-bold text-ink-900 tracking-tight uppercase tracking-wide">
							Journal des Présences
						</h3>
					</div>
					<div className="bg-white rounded-[24px] border border-line shadow-sm overflow-hidden">
						<div className="overflow-x-auto custom-scrollbar">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="bg-surface-50 border-b border-line">
										<th className="px-8 py-5 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Date & Séance</th>
										<th className="px-8 py-5 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Module / Activité</th>
										<th className="px-8 py-5 text-[10px] font-bold text-ink-400 uppercase tracking-widest text-center">Statut</th>
										<th className="px-8 py-5 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Commentaires</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{student.attendance.map((record) => (
										<tr
											key={record.id}
											className="hover:bg-surface-50/50 transition-colors group"
										>
											<td className="px-8 py-6">
												<div className="text-sm font-bold text-ink-900">
													{formatDate(record.session.startTime, locale)}
												</div>
												<div className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mt-1 flex items-center gap-1.5 opacity-60">
													<Clock size={10} /> {formatTime(record.session.startTime)}
												</div>
											</td>
											<td className="px-8 py-6">
												<span className="text-[10px] font-bold text-brand-900 uppercase tracking-wider bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl">
													{record.session.activity.name}
												</span>
											</td>
											<td className="px-8 py-6 text-center">
												<span
													className={clsx(
                                                        "text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm inline-block min-w-[100px]",
                                                        record.status === "PRESENT" 
                                                            ? "bg-success-50 text-success border-success/10" 
                                                            : record.status === "ABSENT"
                                                                ? "bg-rose-50 text-danger border-danger/10"
                                                                : "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}
												>
													{record.status}
												</span>
											</td>
											<td className="px-8 py-6 text-xs text-ink-500 font-medium italic opacity-70">
												{record.note || "Aucune observation"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{student.attendance.length === 0 && (
							<div className="py-24 text-center bg-white border-t border-line">
								<Calendar
									size={48}
									className="mx-auto mb-4 text-ink-100"
								/>
								<p className="font-bold uppercase tracking-widest text-[11px] text-ink-300">
									Historique vierge
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
