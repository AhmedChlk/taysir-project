"use client";

import { motion } from "framer-motion";
import {
	AlertCircle,
	Calendar,
	Clock,
	MapPin,
	PlusCircle,
	User,
	Users,
	Wallet,
	X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PaymentPlanForm from "@/components/dashboard/forms/PaymentPlanForm";
import SessionForm from "@/components/dashboard/forms/SessionForm";
import { formatFullName } from "@/utils/format";

type DrawerType =
	| "new-session"
	| "payments"
	| "new-finance"
	| "edit-staff"
	| "sessions"
	| (string & Record<never, never>);

interface TodaySession {
	id: string;
	startTime: Date | string;
	activity: { name: string };
	group: { name: string };
	room: { name: string };
	instructor: { firstName: string; lastName: string };
}

interface PendingPaymentTranche {
	id: string;
	dueDate: Date | string;
	amount: number;
}

interface PendingPayment {
	id: string;
	totalAmount: number;
	paidAmount: number;
	tranches: PendingPaymentTranche[];
	student: { firstName: string; lastName: string };
}

interface DrawerFormData {
	rooms?: { id: string; name: string; capacity: number }[];
	activities?: { id: string; name: string; color?: string | null }[];
	staff?: { id: string; role: string; firstName: string; lastName: string }[];
	groups?: { id: string; name: string }[];
	students?: { id: string; firstName: string; lastName: string }[];
	todaySessions?: TodaySession[];
	pendingPayments?: PendingPayment[];
}

interface DrawerProps {
	type: DrawerType;
	onClose: () => void;
	formData?: DrawerFormData;
}

export default function Drawer({ type, onClose, formData }: DrawerProps) {
	const searchParams = useSearchParams();
	const _id = searchParams.get("id");
	const t = useTranslations();

	const getTitle = () => {
		switch (type) {
			case "payments":
				return t("drawer_payments");
			case "new-finance":
				return t("drawer_new_finance");
			case "edit-staff":
				return t("drawer_edit_staff");
			case "sessions":
				return t("drawer_sessions");
			case "new-session":
				return t("drawer_new_session");
			default:
				return t("drawer_operational");
		}
	};

	const getIcon = () => {
		switch (type) {
			case "payments":
				return <Wallet size={20} />;
			case "new-finance":
				return <Wallet size={20} />;
			case "edit-staff":
				return <Users size={20} />;
			case "sessions":
				return <Calendar size={20} />;
			case "new-session":
				return <PlusCircle size={20} />;
			default:
				return <AlertCircle size={20} />;
		}
	};

	const renderContent = () => {
		switch (type) {
			case "new-session":
				return (
					<SessionForm
						onSuccess={onClose}
						rooms={formData?.rooms ?? []}
						activities={formData?.activities ?? []}
						staff={formData?.staff ?? []}
						groups={formData?.groups ?? []}
					/>
				);
			case "new-finance":
				return (
					<PaymentPlanForm
						onSuccess={onClose}
						students={formData?.students ?? []}
						activities={formData?.activities ?? []}
					/>
				);
			case "sessions":
				return (
					<div className="space-y-4">
						{(formData?.todaySessions?.length ?? 0) > 0 ? (
							formData?.todaySessions?.map((session) => (
								<div
									key={session.id}
									className="p-5 rounded-[24px] bg-white border border-taysir-teal/5 shadow-sm hover:shadow-md transition-all group"
								>
									<div className="flex justify-between items-start mb-3">
										<span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-taysir-teal/5 text-taysir-teal rounded-lg">
											{session.activity.name}
										</span>
										<div className="flex items-center gap-1 text-taysir-teal font-bold text-xs">
											<Clock size={12} />
											{new Date(session.startTime).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</div>
									</div>
									<h4 className="text-lg font-black text-taysir-teal uppercase tracking-tighter mb-4">
										{session.group.name}
									</h4>
									<div className="flex items-center justify-between pt-4 border-t border-taysir-teal/5">
										<div className="flex items-center gap-2 text-xs font-medium text-taysir-teal/60">
											<MapPin size={14} />
											{session.room.name}
										</div>
										<div className="flex items-center gap-2 text-xs font-bold text-taysir-teal">
											<User size={14} className="opacity-40" />
											{formatFullName(
												session.instructor.firstName,
												session.instructor.lastName,
											)}
										</div>
									</div>
								</div>
							))
						) : (
							<div className="py-20 text-center opacity-30">
								<Calendar size={48} className="mx-auto mb-4" />
								<p className="font-bold uppercase tracking-widest">
									{t("no_sessions_today")}
								</p>
							</div>
						)}
					</div>
				);
			case "payments":
				return (
					<div className="space-y-4">
						{(formData?.pendingPayments?.length ?? 0) > 0 ? (
							formData?.pendingPayments?.map((plan) => (
								<div
									key={plan.id}
									className="p-5 rounded-[24px] bg-white border border-taysir-teal/5 shadow-sm hover:shadow-md transition-all"
								>
									<div className="flex justify-between items-center mb-4">
										<div>
											<h4 className="font-black text-taysir-teal uppercase tracking-tighter">
												{formatFullName(
													plan.student.firstName,
													plan.student.lastName,
												)}
											</h4>
											<p className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest">
												Total: {plan.totalAmount.toLocaleString()} DZD
											</p>
										</div>
										<div className="text-right">
											<div className="text-rose-500 font-black text-sm">
												-{(plan.totalAmount - plan.paidAmount).toLocaleString()}{" "}
												DZD
											</div>
											<p className="text-[10px] font-bold text-rose-500/50 uppercase">
												{t("remaining")}
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{plan.tranches.slice(0, 2).map((tranche, _idx: number) => (
											<div
												key={tranche.id}
												className="flex items-center justify-between p-2 bg-taysir-bg rounded-xl text-[10px] font-bold uppercase tracking-tight"
											>
												<span className="opacity-40">
													Échéance{" "}
													{new Date(tranche.dueDate).toLocaleDateString()}
												</span>
												<span>{tranche.amount.toLocaleString()} DZD</span>
											</div>
										))}
										{plan.tranches.length > 2 && (
											<div className="text-center text-[8px] font-black text-taysir-teal/20 uppercase tracking-[0.2em] pt-1">
												+ {plan.tranches.length - 2} autres échéances
											</div>
										)}
									</div>
								</div>
							))
						) : (
							<div className="py-20 text-center opacity-30">
								<Wallet size={48} className="mx-auto mb-4" />
								<p className="font-bold uppercase tracking-widest">
									{t("all_payments_up_to_date")}
								</p>
							</div>
						)}
					</div>
				);
			default:
				return (
					<div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20">
						<AlertCircle size={48} className="mb-4" />
						<p className="font-black text-taysir-teal uppercase tracking-tighter">
							Bientôt disponible
						</p>
						<p className="text-sm font-medium mt-2">
							L&apos;interface détaillée pour {type} sera injectée ici.
						</p>
					</div>
				);
		}
	};

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 bg-taysir-teal/20 backdrop-blur-sm z-[100]"
			/>

			<motion.div
				initial={{ x: "100%" }}
				animate={{ x: 0 }}
				exit={{ x: "100%" }}
				transition={{ type: "spring", damping: 25, stiffness: 200 }}
				className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-[101] border-l border-taysir-teal/5 flex flex-col"
			>
				<div className="p-8 border-b border-taysir-teal/5 flex justify-between items-center bg-white sticky top-0 z-10">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-taysir-teal/5 rounded-2xl text-taysir-teal">
							{getIcon()}
						</div>
						<div>
							<h2 className="text-xl font-black text-taysir-teal uppercase tracking-tighter leading-none">
								{getTitle()}
							</h2>
							<p className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-[0.2em] mt-1">
								{type.includes("new")
									? "Nouveau Dossier"
									: `Vue Opérationnelle`}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-taysir-teal/5 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-taysir-bg/10">
					{renderContent()}
				</div>

				<div className="p-8 border-t border-taysir-teal/5 bg-white">
					<button
						type="button"
						onClick={onClose}
						className="w-full py-4 rounded-2xl border-2 border-taysir-teal/10 text-taysir-teal font-black uppercase tracking-widest text-xs hover:bg-taysir-teal/5 transition-all active:scale-95"
					>
						{t("close_drawer")}
					</button>
				</div>
			</motion.div>
		</>
	);
}
