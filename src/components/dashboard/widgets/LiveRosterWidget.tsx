import { Edit2, Mail, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getStaff } from "@/services/api";
import type { User } from "@/types/schema";
import { cn } from "@/utils/format";

export default async function LiveRosterWidget() {
	const t = await getTranslations();
	const staff = await getStaff();

	return (
		<div className="h-full bg-white rounded-[24px] border border-line p-8 flex flex-col gap-6 group shadow-sm hover:shadow-ts-2 transition-all duration-300 relative overflow-hidden">
			<div className="flex justify-between items-center relative z-10 mb-2">
				<div>
					<h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em] flex items-center gap-2">
						<Users size={16} className="text-brand-500" strokeWidth={2.5} />{" "}
						{t("roster_title")}
					</h3>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[10px] font-bold bg-success-50 text-success px-2.5 py-1 rounded-full uppercase tracking-widest border border-success/10 flex items-center gap-1.5">
						<div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
						{staff.filter((m: User) => m.status === "ACTIVE").length}
					</span>
				</div>
			</div>

			<div className="flex flex-col gap-3 relative z-10 flex-1">
				{staff.slice(0, 5).map((member: User) => (
					<div
						key={member.id}
						className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-line hover:bg-surface-50 transition-all group/item"
					>
						<div className="flex items-center gap-3 overflow-hidden">
							<div className="relative shrink-0">
								<div className="w-10 h-10 rounded-xl bg-surface-50 flex items-center justify-center text-brand-900 font-bold text-sm uppercase overflow-hidden border border-line">
									{member.avatarUrl ? (
										<Image
											src={member.avatarUrl}
											alt={member.firstName}
											fill
											className="object-cover"
										/>
									) : (
										(member.firstName[0] ?? "") +
										(member.lastName ? (member.lastName[0] ?? "") : "")
									)}
								</div>
								<div
									className={cn(
										"absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center",
										member.status === "ACTIVE"
											? "bg-success"
											: member.status === "ON_LEAVE"
												? "bg-amber-500"
												: "bg-danger",
									)}
								/>
							</div>
							<div className="overflow-hidden">
								<div className="text-sm font-bold text-ink-900 truncate tracking-tight">
									{member.firstName} {member.lastName}
								</div>
								<div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest truncate mt-0.5">
									{member.role}
								</div>
							</div>
						</div>

						<div className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
							<Link
								href="/dashboard/staff"
								className="p-2 rounded-xl bg-white text-ink-400 hover:text-brand-500 border border-line hover:border-brand-500/20 transition-all shadow-sm block"
							>
								<Edit2 size={14} />
							</Link>
						</div>
					</div>
				))}
			</div>

			{staff.length > 5 && (
				<div className="text-center pt-4 border-t border-line mt-auto">
					<Link
						href="/dashboard/staff"
						className="text-[10px] font-bold text-brand-500 hover:text-brand-700 uppercase tracking-[0.2em] transition-colors"
					>
						{t("roster_view_more", { count: staff.length - 5 })} →
					</Link>
				</div>
			)}
		</div>
	);
}
