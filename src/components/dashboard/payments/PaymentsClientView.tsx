"use client";

import { clsx } from "clsx";
import {
	AlertCircle,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
	Download,
	Loader2,
	MessageCircle,
	Plus,
	Search,
	Smartphone,
	Wallet,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
	useCallback,
	useEffect,
	useMemo,
	useOptimistic,
	useState,
	useTransition,
} from "react";
import {
	createPaymentPlanAction,
	registerBulkPaymentAction,
	registerPaymentAction,
} from "@/actions/finance.actions";
import { RelanceButton } from "@/components/dashboard/payments/RelanceButton";
import { Input, Select } from "@/components/ui/FormInput";
import Modal from "@/components/ui/Modal";
import { PdfPreviewModal } from "@/components/ui/PdfPreviewModal";
import {
	Button,
	Card,
	PageHeader,
	SectionEmpty,
	StatCard,
} from "@/components/ui/primitives";
import { useRouter } from "@/i18n/routing";
import {
	type CsvCell,
	csvDateStamp,
	downloadCsv,
	toCsv,
} from "@/lib/export-csv";
import { agingSummary, overdueInfo } from "@/lib/payment-aging";
import { generatePaymentPlanReceiptPDF } from "@/lib/pdf-generators/payment-receipt";
import { localizedSubject } from "@/lib/subjects";
import {
	buildReceiptMessage,
	buildRelanceMessage,
	buildSmsUrl,
	buildWaUrl,
	normalizeDzPhone,
} from "@/lib/wa-relance";
import type { Activity, Payment, PaymentMethod, Student } from "@/types/schema";
import { formatCurrency, formatFullName } from "@/utils/format";

interface PaymentsClientViewProps {
	initialPayments: Payment[];
	students: Student[];
	activities: Activity[];
	schoolName?: string;
	relanceMap?: Record<string, string>;
}

// Valeur sentinelle du sélecteur → règlement réparti automatiquement sur les
// échéances impayées les plus anciennes (paie plusieurs tranches en 1 fois).
const BULK_TRANCHE = "BULK";

type OptimisticPaymentAction =
	| { type: "create"; payment: Payment }
	| { type: "register"; trancheId: string; amount: number; paymentId: string };

export default function PaymentsClientView({
	initialPayments = [],
	students = [],
	activities = [],
	schoolName = "",
	relanceMap = {},
}: PaymentsClientViewProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isManageModalOpen, setIsManageModalOpen] = useState(false);
	const [isReceiptOpen, setIsReceiptOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selectedPaymentState, setSelectedPaymentState] =
		useState<Payment | null>(null);
	const [isPending, startTransition] = useTransition();
	const [receiptWa, setReceiptWa] = useState<{
		name: string;
		waUrl: string;
		smsUrl: string;
	} | null>(null);
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();

	const [optimisticPayments, applyOptimistic] = useOptimistic(
		initialPayments,
		(state: Payment[], action: OptimisticPaymentAction) => {
			if (action.type === "create") {
				return [...state, action.payment];
			}
			if (action.type === "register") {
				return state.map((p) => {
					if (p.id !== action.paymentId) return p;
					const updatedTranches = (p.tranches ?? []).map((tr) =>
						tr.id === action.trancheId ? { ...tr, isPaid: true } : tr,
					);
					const newPaid = p.paidAmount + action.amount;
					const newStatus =
						newPaid >= p.totalAmount
							? "PAID"
							: newPaid > 0
								? "PARTIAL"
								: p.status;
					return {
						...p,
						paidAmount: newPaid,
						status: newStatus as Payment["status"],
						tranches: updatedTranches,
					};
				});
			}
			return state;
		},
	);

	const selectedPayment = useMemo(() => {
		if (!selectedPaymentState) return null;
		return (
			optimisticPayments.find((p) => p.id === selectedPaymentState.id) ||
			selectedPaymentState
		);
	}, [optimisticPayments, selectedPaymentState]);

	const [newPlanStudentId, setNewPlanStudentId] = useState("");
	const [newPlanActivityId, setNewPlanActivityId] = useState("");
	const [newPlanTotal, setNewPlanTotal] = useState(0);
	const [tranchesCount, setTranchesCount] = useState(1);

	const [selectedTrancheId, setSelectedTrancheId] = useState("");
	const [paymentAmount, setPaymentAmount] = useState(0);
	const [paymentMethod, _setPaymentMethod] = useState<PaymentMethod>("CASH");

	const studentsMap = useMemo(() => {
		return (students || []).reduce(
			(acc, s) => {
				acc[s.id] = s;
				return acc;
			},
			{} as Record<string, Student>,
		);
	}, [students]);

	const filteredPayments = useMemo(() => {
		return (optimisticPayments || []).filter((payment) => {
			const student = studentsMap[payment.studentId];
			const studentName = formatFullName(
				student?.firstName,
				student?.lastName,
			).toLowerCase();
			const nameMatch = studentName.includes(searchTerm.toLowerCase());
			const statusMatch =
				statusFilter === "all" || payment.status === statusFilter;
			return nameMatch && statusMatch;
		});
	}, [searchTerm, statusFilter, optimisticPayments, studentsMap]);

	const handleManage = (payment: Payment) => {
		setSelectedPaymentState(payment);
		setIsManageModalOpen(true);
		setSelectedTrancheId("");
		setPaymentAmount(0);
	};

	const handleAddPlan = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPlanStudentId || !newPlanActivityId || newPlanTotal <= 0) return;

		const trancheAmount = Math.floor(newPlanTotal / tranchesCount);
		const tranches = Array.from({ length: tranchesCount }).map((_, i) => {
			const date = new Date();
			date.setMonth(date.getMonth() + i);
			return {
				amount:
					i === tranchesCount - 1
						? newPlanTotal - trancheAmount * (tranchesCount - 1)
						: trancheAmount,
				dueDate: date.toISOString().split("T")[0] ?? date.toISOString(),
			};
		});

		startTransition(async () => {
			const result = await createPaymentPlanAction({
				studentId: newPlanStudentId,
				activityId: newPlanActivityId,
				totalAmount: newPlanTotal,
				currency: "DZD",
				tranches,
			});

			if (result.success) {
				setIsAddModalOpen(false);
				setNewPlanStudentId("");
				setNewPlanActivityId("");
				setNewPlanTotal(0);
				setTranchesCount(1);
				router.refresh();
			} else {
				setErrorMessage(result.error.message);
			}
		});
	};

	const getMonthName = (dateStr: string | Date) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
	};

	// Reçu WhatsApp au parent : envoi en 1 clic (wa.me n'accepte pas de pièce
	// jointe, le message porte le détail du reçu ; le PDF reste téléchargeable).
	const openReceipt = (r: {
		studentFirstName: string;
		studentLastName: string;
		amount: number;
		receiptNumber: number | null;
		remaining: number;
		parentPhone: string | null;
		schoolName: string;
	}) => {
		const phone = normalizeDzPhone(r.parentPhone);
		if (!phone) return;
		const message = buildReceiptMessage({
			studentFirstName: r.studentFirstName,
			amount: r.amount,
			receiptNumber: r.receiptNumber,
			remaining: r.remaining,
			school: r.schoolName,
			locale,
		});
		// Envoi OPTIONNEL : on prépare les liens (WhatsApp + SMS) et on affiche un
		// bandeau ; aucun onglet ne s'ouvre automatiquement — c'est l'utilisateur
		// qui choisit le canal (certains parents en Algérie n'ont pas WhatsApp).
		setReceiptWa({
			name: `${r.studentFirstName} ${r.studentLastName}`,
			waUrl: buildWaUrl(phone, message),
			smsUrl: buildSmsUrl(phone, message),
		});
	};

	const handleRegisterPayment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedTrancheId || paymentAmount <= 0 || !selectedPayment) return;

		const paymentId = selectedPayment.id;
		const trancheId = selectedTrancheId;
		const amount = paymentAmount;
		const isBulk = trancheId === BULK_TRANCHE;

		setReceiptWa(null);
		startTransition(async () => {
			if (!isBulk) {
				applyOptimistic({ type: "register", trancheId, amount, paymentId });
			}
			setPaymentAmount(0);
			setSelectedTrancheId("");

			const result = isBulk
				? await registerBulkPaymentAction({
						paymentPlanId: paymentId,
						montant_paye: amount,
						methode: paymentMethod,
					})
				: await registerPaymentAction({
						trancheId,
						montant_paye: amount,
						methode: paymentMethod,
					});

			if (!result.success) {
				setErrorMessage(result.error.message);
			} else {
				openReceipt(result.data.receipt);
			}
			router.refresh();
		});
	};

	const stats = useMemo(() => {
		const total = optimisticPayments.reduce((acc, p) => acc + p.totalAmount, 0);
		const paid = optimisticPayments.reduce((acc, p) => acc + p.paidAmount, 0);
		const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
		return { total, paid, remaining: total - paid, rate };
	}, [optimisticPayments]);

	// Ancienneté des impayés — ce que le dirigeant doit voir en premier.
	const aging = useMemo(
		() => agingSummary(optimisticPayments),
		[optimisticPayments],
	);

	// Reçu PDF du plan sélectionné (tous les règlements déjà encaissés).
	const receiptBuild = useCallback(() => {
		const p = selectedPayment;
		const student = p ? studentsMap[p.studentId] : null;
		const payments = (p?.tranches ?? [])
			.filter((tr) => tr.isPaid)
			.flatMap((tr) =>
				(tr.paiements ?? []).map((pm) => ({
					paidDate: new Date(pm.date).toLocaleDateString("fr-FR"),
					dueLabel: new Date(tr.dueDate).toLocaleDateString("fr-FR"),
					method: pm.method,
					amount: pm.amount,
				})),
			);
		return generatePaymentPlanReceiptPDF({
			school: schoolName || "Taysir",
			studentName: student
				? formatFullName(student.firstName, student.lastName)
				: "—",
			activity: p?.activity?.name ?? "—",
			receiptNumber: p ? `R-${p.id.slice(0, 8).toUpperCase()}` : "—",
			date: new Date().toLocaleDateString("fr-FR"),
			paidAmount: p?.paidAmount ?? 0,
			remaining: p ? p.totalAmount - p.paidAmount : 0,
			payments,
		});
	}, [selectedPayment, studentsMap, schoolName]);

	const exportToCSV = () => {
		const headers = [
			t("students_identity"),
			t("payments_activity"),
			t("payments_total_amount"),
			t("payments_paid_amount_col"),
			t("payments_remaining"),
			t("payments_status"),
		];
		const rows: CsvCell[][] = filteredPayments.map((p) => {
			const student = studentsMap[p.studentId];
			const studentName = student
				? formatFullName(student.firstName, student.lastName)
				: t("unknown");
			return [
				studentName,
				p.activity?.name || "N/A",
				p.totalAmount,
				p.paidAmount,
				p.totalAmount - p.paidAmount,
				p.status,
			];
		});

		downloadCsv(`paiements_${csvDateStamp()}.csv`, toCsv(headers, rows));
	};

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow={t("payments_subtitle")}
				title={t("payments_manage_title")}
				accent={t("payments")}
				subtitle={t("payments_subtitle_tail")}
				actions={
					<>
						<Button
							variant="secondary"
							onClick={exportToCSV}
							icon={<Download size={18} />}
						>
							{t("payments_export_csv")}
						</Button>
						<Button
							onClick={() => setIsAddModalOpen(true)}
							icon={<Plus size={18} strokeWidth={2.5} />}
						>
							{t("payments_new_plan")}
						</Button>
					</>
				}
			/>

			{/* KPI — focal first: money at risk (Reste à recouvrer) leads, danger tone. */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="lg:col-span-2">
					<StatCard
						label={t("payments_remaining_collect")}
						value={formatCurrency(stats.remaining)}
						icon={<AlertCircle size={22} />}
						tone="danger"
					/>
				</div>
				<StatCard
					label={t("payments_total_collected")}
					value={formatCurrency(stats.paid)}
					icon={<CheckCircle2 size={22} />}
					tone="positive"
				/>
				<StatCard
					label={t("payments_total_forecast")}
					value={formatCurrency(stats.total)}
					icon={<Wallet size={22} />}
					tone="brand"
				/>
			</div>

			{/* Ancienneté des impayés (aging) — visible seulement s'il y a du retard */}
			{aging.overdueTotal > 0 && (
				<Card className="flex flex-col gap-4 border-accent/20 bg-accent-50/40 lg:flex-row lg:items-center">
					<div className="flex items-center gap-3 lg:min-w-[230px]">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
							<AlertCircle size={22} />
						</span>
						<div>
							<div className="text-[11px] font-bold uppercase tracking-widest text-accent-600">
								{t("payments_overdue_title")}
							</div>
							<div className="text-xl font-extrabold tracking-tight text-accent-600">
								{formatCurrency(aging.overdueTotal)}
							</div>
							<div className="text-xs font-semibold text-ink-500">
								{aging.count} {t("students_count_suffix")}{" "}
								{t("payments_concerned")}
							</div>
						</div>
					</div>
					<div className="grid flex-1 grid-cols-3 gap-3">
						<AgingBucket label="0–30 j" value={aging.b0_30} tone="brass" />
						<AgingBucket label="30–60 j" value={aging.b30_60} tone="accent" />
						<AgingBucket label="60 j +" value={aging.b60plus} tone="deep" />
					</div>
				</Card>
			)}

			{/* Filters */}
			<Card className="flex flex-col gap-3 md:flex-row md:items-center">
				<div className="relative flex-1">
					<Search
						className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-400"
						size={18}
					/>
					<input
						type="text"
						placeholder={t("payments_search_placeholder")}
						className="block w-full rounded-xl border border-line/70 bg-surface-50 py-2.5 ps-12 pe-4 text-sm font-medium text-ink-900 placeholder-ink-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/5"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className="flex items-center gap-2 rounded-xl border border-line/70 bg-surface-50 px-4 md:min-w-[200px]">
					<FilterIcon size={16} className="text-ink-400" />
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="h-9 flex-1 cursor-pointer border-none bg-transparent text-sm font-bold text-ink-700 focus:ring-0"
					>
						<option value="all">{t("payments_all_statuses")}</option>
						<option value="PAID">{t("paid")}</option>
						<option value="PARTIAL">{t("partial")}</option>
						<option value="PENDING">{t("pending")}</option>
					</select>
				</div>
			</Card>

			{/* Table */}
			{filteredPayments.length > 0 ? (
				<Card pad={false} className="overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-sm">
							<thead>
								<tr className="border-b border-line/70 bg-surface-50">
									<th className="px-6 py-4 text-start text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
										{t("students_identity")}
									</th>
									<th className="px-6 py-4 text-start text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
										{t("payments_collected")}
									</th>
									<th className="px-6 py-4 text-end text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
										{t("payments_total_amount")}
									</th>
									<th className="px-6 py-4 text-end text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
										{t("payments_remaining")}
									</th>
									<th className="px-6 py-4 text-start text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
										{t("payments_status")}
									</th>
									<th className="px-6 py-4 text-end text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400" />
								</tr>
							</thead>
							<tbody className="divide-y divide-line/60">
								{filteredPayments.map((payment) => {
									const student = studentsMap[payment.studentId];
									if (!student) return null;
									return (
										<PaymentRow
											key={payment.id}
											payment={payment}
											student={student}
											schoolName={schoolName}
											lastRelance={relanceMap[payment.studentId]}
											onManage={handleManage}
											t={t}
										/>
									);
								})}
							</tbody>
						</table>
					</div>
				</Card>
			) : (
				<Card>
					<SectionEmpty
						icon={<DollarSign size={24} />}
						title={t("payments_no_plan_found")}
						hint={t("payments_empty_desc")}
						action={
							<Button
								onClick={() => setIsAddModalOpen(true)}
								icon={<Plus size={18} strokeWidth={2.5} />}
							>
								{t("payments_create_plan")}
							</Button>
						}
					/>
				</Card>
			)}

			{/* Modal: Add New Payment Plan */}
			<Modal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				title={t("payments_create_plan_title")}
				footer={
					<div className="flex w-full items-center justify-end gap-3">
						<Button
							variant="secondary"
							onClick={() => setIsAddModalOpen(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							form="add-plan-form"
							type="submit"
							disabled={
								isPending ||
								!newPlanStudentId ||
								!newPlanActivityId ||
								newPlanTotal <= 0
							}
							icon={
								isPending ? (
									<Loader2 size={18} className="animate-spin" />
								) : undefined
							}
						>
							{t("payments_create_schedule")}
						</Button>
					</div>
				}
			>
				<form
					id="add-plan-form"
					onSubmit={handleAddPlan}
					className="space-y-6 py-2"
				>
					<Card tone="ghost" className="space-y-4">
						<Select
							label={t("payments_student_concerned")}
							value={newPlanStudentId}
							onChange={(e) => setNewPlanStudentId(e.target.value)}
							options={[
								{ label: t("payments_select_student"), value: "" },
								...students.map((s) => ({
									label: formatFullName(s.firstName, s.lastName),
									value: s.id,
								})),
							]}
							required
						/>
						<Select
							label={t("activity_associated")}
							value={newPlanActivityId}
							onChange={(e) => setNewPlanActivityId(e.target.value)}
							options={[
								{ label: t("payments_select_activity"), value: "" },
								...activities.map((a) => ({ label: a.name, value: a.id })),
							]}
							required
						/>
						<div className="grid grid-cols-2 gap-4">
							<Input
								label={t("payments_total_amount_da")}
								type="number"
								value={newPlanTotal}
								onChange={(e) => setNewPlanTotal(Number(e.target.value))}
								placeholder="Ex: 15000"
								required
							/>
							<Input
								label={t("payments_tranches_count")}
								type="number"
								min="1"
								max="12"
								value={tranchesCount}
								onChange={(e) => setTranchesCount(Number(e.target.value))}
								placeholder="Ex: 3"
								required
							/>
						</div>
					</Card>
					<div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
						<Calendar size={18} className="mt-0.5 shrink-0 text-brand-500" />
						<p className="text-xs font-medium leading-relaxed text-brand-700">
							Les tranches seront automatiquement espacées d&apos;un mois à
							partir d&apos;aujourd&apos;hui. Vous pourrez les modifier
							individuellement par la suite.
						</p>
					</div>
				</form>
			</Modal>

			{/* Modal: Manage Payment / Echeancier */}
			<Modal
				isOpen={isManageModalOpen}
				onClose={() => setIsManageModalOpen(false)}
				title={t("payments_schedule_details")}
				footer={
					<div className="flex w-full items-center justify-between gap-3">
						<Button
							variant="secondary"
							icon={<Download size={16} />}
							onClick={() => setIsReceiptOpen(true)}
							disabled={(selectedPayment?.paidAmount ?? 0) <= 0}
						>
							{t("payments_receipt_pdf")}
						</Button>
						<Button onClick={() => setIsManageModalOpen(false)}>
							{t("payments_done")}
						</Button>
					</div>
				}
			>
				<div className="space-y-8 py-2">
					{/* Header Info */}
					<div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white shadow-sm">
						<div>
							<p className="text-[10px] font-black uppercase tracking-widest opacity-70">
								{t("payments_remaining_to_pay")}
							</p>
							<p className="text-3xl font-black">
								{formatCurrency(
									(selectedPayment?.totalAmount || 0) -
										(selectedPayment?.paidAmount || 0),
								)}
							</p>
						</div>
						<div className="text-end">
							<p className="text-sm font-bold">
								{formatFullName(
									studentsMap[selectedPayment?.studentId || ""]?.firstName,
									studentsMap[selectedPayment?.studentId || ""]?.lastName,
								)}
							</p>
							<p className="text-[10px] font-medium italic opacity-70">
								Plan ID: {selectedPayment?.id.split("-")[0]}
							</p>
						</div>
					</div>

					{/* Register New Payment Form */}
					<form
						onSubmit={handleRegisterPayment}
						className="space-y-4 rounded-2xl border border-line/70 bg-surface-white p-5 shadow-ts-1"
					>
						<h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-ink-400">
							<DollarSign size={14} className="text-emerald-600" />
							{t("payments_register_payment_title")}
						</h4>
						{/* Règlement rapide de tout le solde (plusieurs échéances d'un coup) */}
						{(() => {
							const unpaidCount =
								selectedPayment?.tranches?.filter((tr) => !tr.isPaid).length ??
								0;
							const planRemaining =
								(selectedPayment?.totalAmount || 0) -
								(selectedPayment?.paidAmount || 0);
							if (unpaidCount < 2 || planRemaining <= 0) return null;
							return (
								<button
									type="button"
									onClick={() => {
										setSelectedTrancheId(BULK_TRANCHE);
										setPaymentAmount(planRemaining);
									}}
									className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
								>
									<CheckCircle2 size={14} />
									{t("payments_settle_all")} · {unpaidCount}{" "}
									{t("payments_installments_word")} ·{" "}
									{formatCurrency(planRemaining)}
								</button>
							);
						})()}
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<div className="md:col-span-1">
								<select
									value={selectedTrancheId}
									onChange={(e) => {
										setSelectedTrancheId(e.target.value);
										if (e.target.value === BULK_TRANCHE) {
											setPaymentAmount(
												(selectedPayment?.totalAmount || 0) -
													(selectedPayment?.paidAmount || 0),
											);
											return;
										}
										const tr = selectedPayment?.tranches?.find(
											(tranche) => tranche.id === e.target.value,
										);
										if (tr) setPaymentAmount(tr.amount);
									}}
									className="h-9 w-full rounded-xl border border-line/70 bg-surface-50 px-4 text-sm font-bold text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/5"
									required
								>
									<option value="">{t("payments_choose_tranche")}</option>
									{(selectedPayment?.tranches?.filter((tr) => !tr.isPaid)
										.length ?? 0) >= 2 && (
										<option value={BULK_TRANCHE}>
											▸ {t("payments_auto_distribute")}
										</option>
									)}
									{selectedPayment?.tranches
										?.filter((tr) => !tr.isPaid)
										.map((tranche) => (
											<option key={tranche.id} value={tranche.id}>
												{t("payments_month_label")}{" "}
												{getMonthName(tranche.dueDate)} (
												{formatCurrency(tranche.amount)})
											</option>
										))}
								</select>
							</div>
							<input
								type="number"
								placeholder={t("payments_amount_da")}
								value={paymentAmount || ""}
								onChange={(e) => setPaymentAmount(Number(e.target.value))}
								className="h-9 w-full rounded-xl border border-line/70 bg-surface-50 px-4 text-sm font-bold text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/5"
								required
							/>
							<Button
								type="submit"
								disabled={isPending || !selectedTrancheId || paymentAmount <= 0}
								icon={
									isPending ? (
										<Loader2 size={16} className="animate-spin" />
									) : (
										<CheckCircle2 size={16} />
									)
								}
							>
								{t("payments_validate")}
							</Button>
						</div>
					</form>

					{/* Reçu au parent — envoi OPTIONNEL après un règlement : l'utilisateur
					    choisit le canal (WhatsApp ou SMS). Rien ne s'ouvre tout seul. */}
					{receiptWa && (
						<div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
							<CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
							<div className="min-w-0 flex-1">
								<p className="text-sm font-bold text-emerald-800">
									{t("payment_recorded")}
								</p>
								<p className="truncate text-xs text-emerald-700">
									{t("send_receipt_optional")} · {receiptWa.name}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<a
									href={receiptWa.waUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
								>
									<MessageCircle size={14} />
									{t("receipt_via_whatsapp")}
								</a>
								<a
									href={receiptWa.smsUrl}
									className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-bold text-ink-700 transition-colors hover:bg-surface-50"
								>
									<Smartphone size={14} />
									{t("receipt_via_sms")}
								</a>
								<button
									type="button"
									onClick={() => setReceiptWa(null)}
									className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-ink-700"
									aria-label={t("close_drawer")}
								>
									<X size={16} />
								</button>
							</div>
						</div>
					)}

					{/* Echeancier (Timeline) */}
					<div className="space-y-4">
						<h4 className="flex items-center gap-2 px-2 text-xs font-black uppercase tracking-widest text-ink-400">
							<Calendar size={14} className="text-brand-500" />
							{t("payments_monthly_schedule")}
						</h4>
						<div className="space-y-3">
							{selectedPayment?.tranches?.map((tranche) => (
								<div
									key={tranche.id}
									className={clsx(
										"flex items-center gap-4 rounded-2xl border p-4 transition-all",
										tranche.isPaid
											? "border-emerald-100 bg-emerald-50/50 opacity-70"
											: "border-line/70 bg-surface-white shadow-ts-1",
									)}
								>
									<div
										className={clsx(
											"flex h-[60px] min-w-[60px] flex-col items-center justify-center rounded-xl text-xs font-black",
											tranche.isPaid
												? "bg-emerald-500 text-white"
												: "bg-surface-100 text-ink-400",
										)}
									>
										<span>{new Date(tranche.dueDate).getDate()}</span>
										<span className="text-[10px] uppercase">
											{new Date(tranche.dueDate).toLocaleDateString("fr-FR", {
												month: "short",
											})}
										</span>
									</div>
									<div className="flex-1">
										<p className="text-sm font-bold text-ink-900">
											{formatCurrency(tranche.amount)}
										</p>
										<p className="text-[10px] font-medium text-ink-500">
											{getMonthName(tranche.dueDate)} •{" "}
											{tranche.isPaid
												? t("payments_paid_label")
												: t("payments_to_pay")}
										</p>
									</div>
									{tranche.isPaid ? (
										<div className="rounded-full bg-emerald-500 p-2 text-white">
											<CheckCircle2 size={16} />
										</div>
									) : (
										<div className="rounded-full bg-surface-100 p-2 text-ink-400">
											<Clock size={16} />
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</Modal>

			{isReceiptOpen && selectedPayment && (
				<PdfPreviewModal
					isOpen={isReceiptOpen}
					onClose={() => setIsReceiptOpen(false)}
					title="Reçu de paiement"
					fileName={`Recu_${selectedPayment.id.slice(0, 8)}.pdf`}
					build={receiptBuild}
				/>
			)}

			{/* Erreur inline (remplace alert() natif) — toast discret, dismiss manuel. */}
			{errorMessage && (
				<div className="fixed bottom-8 left-1/2 z-[100] flex min-w-[320px] max-w-md -translate-x-1/2 items-start gap-4 rounded-2xl border-2 border-danger/20 bg-white p-4 shadow-2xl duration-300 animate-in fade-in slide-in-from-bottom-4">
					<div className="shrink-0 rounded-xl bg-rose-50 p-2 text-danger">
						<AlertCircle size={20} />
					</div>
					<div className="flex-1">
						<h4 className="mb-1 text-sm font-bold text-ink-900">
							{t("error_title")}
						</h4>
						<p className="text-xs font-medium leading-relaxed text-ink-500">
							{errorMessage}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setErrorMessage(null)}
						className="rounded-lg p-1 text-ink-400 transition-colors hover:bg-surface-50 hover:text-ink-700"
						aria-label={t("close")}
					>
						<X size={16} />
					</button>
				</div>
			)}
		</div>
	);
}

function PaymentRow({
	payment,
	student,
	schoolName,
	lastRelance,
	onManage,
	t,
}: {
	payment: Payment;
	student: Student;
	schoolName: string;
	lastRelance?: string | undefined;
	onManage: (p: Payment) => void;
	t: ReturnType<typeof useTranslations>;
}) {
	const locale = useLocale();
	// Remplissage animé de la barre au montage (les transitions CSS ne jouent
	// pas sur le rendu initial → on part de 0 puis on pousse à `percent`).
	const [filled, setFilled] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setFilled(true));
		return () => cancelAnimationFrame(id);
	}, []);
	const percent =
		payment.totalAmount > 0
			? Math.round((payment.paidAmount / payment.totalAmount) * 100)
			: 0;
	const paidTranches = payment.tranches?.filter((tr) => tr.isPaid).length || 0;
	const totalTranches = payment.tranches?.length || 0;
	const remaining = payment.totalAmount - payment.paidAmount;

	const overdue = overdueInfo(payment);
	const phone = normalizeDzPhone(student.parentPhone || student.phone);
	const now = Date.now();
	const dueLines = (payment.tranches ?? [])
		.filter((tr) => !tr.isPaid)
		.map((tr) => ({
			dueLabel: new Date(tr.dueDate).toLocaleDateString("fr-FR"),
			amount: tr.amount,
			overdue: new Date(tr.dueDate).getTime() < now,
		}));
	const waUrl =
		remaining > 0 && phone
			? buildWaUrl(
					phone,
					buildRelanceMessage({
						firstName: student.firstName,
						remaining,
						school: schoolName || undefined,
						lines: dueLines,
					}),
				)
			: null;

	return (
		<tr className="group transition-colors hover:bg-surface-50/60">
			{/* Identity */}
			<td className="px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-surface-50 text-sm font-black text-brand-600 transition-transform duration-200 group-hover:scale-105">
						{student.firstName.charAt(0)}
						{student.lastName.charAt(0)}
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-bold tracking-tight text-ink-900">
							{formatFullName(student.firstName, student.lastName)}
						</p>
						<div className="mt-0.5 flex items-center gap-2">
							{payment.activity && (
								<span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-700">
									{localizedSubject(payment.activity.name, locale)}
								</span>
							)}
							<span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
								{t("payments_months_settled", {
									paid: paidTranches,
									total: totalTranches,
								})}
							</span>
						</div>
					</div>
				</div>
			</td>

			{/* Progress */}
			<td className="px-6 py-4">
				<div className="w-40 max-w-[160px] space-y-1.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold tabular-nums text-ink-700">
							{formatCurrency(payment.paidAmount)}
						</span>
						<span className="text-xs font-black text-brand-600">
							{percent}%
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
						<div
							className="h-full rounded-full bg-brand-500 transition-[width] duration-700 ease-out"
							style={{ width: filled ? `${percent}%` : "0%" }}
						/>
					</div>
				</div>
			</td>

			{/* Total */}
			<td className="whitespace-nowrap px-6 py-4 text-end text-sm font-bold tabular-nums text-ink-700">
				{formatCurrency(payment.totalAmount)}
			</td>

			{/* Remaining — focal at-risk figure */}
			<td
				className={clsx(
					"whitespace-nowrap px-6 py-4 text-end text-sm font-black tabular-nums",
					remaining > 0 ? "text-accent-600" : "text-emerald-700",
				)}
			>
				{formatCurrency(remaining)}
			</td>

			{/* Status */}
			<td className="px-6 py-4">
				<div className="flex flex-col items-start gap-1.5">
					<span
						className={clsx(
							"inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
							payment.status === "PAID"
								? "border-emerald-100 bg-emerald-50 text-emerald-700"
								: payment.status === "PARTIAL"
									? "border-brass/20 bg-brass/10 text-brass"
									: "border-accent-100 bg-accent-50 text-accent-600",
						)}
					>
						{payment.status === "PAID"
							? t("payments_settled")
							: payment.status === "PARTIAL"
								? t("partial")
								: t("payments_due")}
					</span>
					{overdue.overdueAmount > 0 && (
						<span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-600">
							<Clock size={10} />
							{t("late_days")} {overdue.daysLate} {t("days_short")}
						</span>
					)}
					{lastRelance && (
						<span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
							<CheckCircle2 size={10} />
							{t("payments_relaunched_on")}{" "}
							{new Date(lastRelance).toLocaleDateString(
								locale === "ar" ? "ar-DZ" : "fr-FR",
							)}
						</span>
					)}
				</div>
			</td>

			{/* Action */}
			<td className="px-6 py-4">
				<div className="flex items-center justify-end gap-2">
					{waUrl && (
						<RelanceButton
							waUrl={waUrl}
							studentId={payment.studentId}
							paymentPlanId={payment.id}
							amount={remaining}
							daysLate={overdue.daysLate}
						/>
					)}
					<Button
						variant="secondary"
						size="sm"
						className="h-9 active:scale-95"
						onClick={() => onManage(payment)}
					>
						{t("payments_manage_schedule")}
						<ArrowRight
							size={14}
							strokeWidth={3}
							className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
						/>
					</Button>
				</div>
			</td>
		</tr>
	);
}

function AgingBucket({
	label,
	value,
	tone,
}: {
	label: string;
	value: number;
	tone: "brass" | "accent" | "deep";
}) {
	const color =
		tone === "brass"
			? "text-brass"
			: tone === "accent"
				? "text-accent-600"
				: "text-accent-700";
	return (
		<div className="rounded-xl border border-line/60 bg-surface-white px-3 py-2.5 text-center">
			<div className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
				{label}
			</div>
			<div className={clsx("text-sm font-extrabold tabular-nums", color)}>
				{formatCurrency(value)}
			</div>
		</div>
	);
}

function FilterIcon({ size, className }: { size: number; className?: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
		</svg>
	);
}
