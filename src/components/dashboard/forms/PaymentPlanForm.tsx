"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Plus, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPaymentPlanAction } from "@/actions/finance.actions";
import { Input, Select } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatFullName } from "@/utils/format";

type StudentOption = { id: string; firstName: string; lastName: string };
type ActivityOption = { id: string; name: string };

interface PaymentPlanFormProps {
	onSuccess?: () => void;
	students?: StudentOption[];
	activities?: ActivityOption[];
}

export default function PaymentPlanForm({
	onSuccess,
	students = [],
	activities = [],
}: PaymentPlanFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [studentId, setStudentId] = useState("");
	const [activityId, setActivityId] = useState("");
	const [totalAmount, setTotalAmount] = useState(0);
	const [tranches, setTranches] = useState<
		{ amount: number; dueDate: string }[]
	>([
		{
			amount: 0,
			dueDate:
				new Date().toISOString().split("T")[0] ?? new Date().toISOString(),
		},
	]);

	const addTranche = () => {
		const lastTranche = tranches[tranches.length - 1];
		if (!lastTranche) return;
		const lastDate = new Date(lastTranche.dueDate);
		const nextDate = new Date(lastDate.setMonth(lastDate.getMonth() + 1));
		const nextDateString =
			nextDate.toISOString().split("T")[0] ?? nextDate.toISOString();
		setTranches([...tranches, { amount: 0, dueDate: nextDateString }]);
	};

	const removeTranche = (index: number) => {
		if (tranches.length > 1) {
			setTranches(tranches.filter((_, i) => i !== index));
		}
	};

	const updateTranche = (
		index: number,
		field: "amount" | "dueDate",
		value: string | number,
	) => {
		const newTranches = [...tranches];
		const existingTranche = newTranches[index];
		if (!existingTranche) return;
		newTranches[index] = { ...existingTranche, [field]: value };
		setTranches(newTranches);
	};

	const distributeAmount = () => {
		if (totalAmount <= 0) return;
		const amountPerTranche = Math.floor(totalAmount / tranches.length);
		const remainder = totalAmount % tranches.length;

		const newTranches = tranches.map((t, i) => ({
			...t,
			amount:
				i === tranches.length - 1
					? amountPerTranche + remainder
					: amountPerTranche,
		}));
		setTranches(newTranches);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const calculatedTotal = tranches.reduce(
			(sum, t) => sum + Number(t.amount),
			0,
		);
		if (calculatedTotal !== totalAmount) {
			setError(
				`La somme des tranches (${calculatedTotal} DZD) ne correspond pas au montant total (${totalAmount} DZD).`,
			);
			return;
		}

		startTransition(async () => {
			const result = await createPaymentPlanAction({
				studentId,
				activityId,
				totalAmount,
				currency: "DZD",
				tranches: tranches.map((t) => ({ ...t, amount: Number(t.amount) })),
			});

			if (result.success) {
				router.refresh();
				if (onSuccess) onSuccess();
			} else {
				setError(result.error.message);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm font-medium"
					>
						<AlertCircle size={18} className="shrink-0 mt-0.5" />
						<p>{error}</p>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="space-y-4">
				<Select
					label="Élève"
					value={studentId}
					onChange={(e) => setStudentId(e.target.value)}
					options={[
						{ label: "Sélectionner un élève...", value: "" },
						...students.map((s) => ({
							label: formatFullName(s.firstName, s.lastName),
							value: s.id,
						})),
					]}
					required
				/>
				<Select
					label="Activité"
					value={activityId}
					onChange={(e) => setActivityId(e.target.value)}
					options={[
						{ label: "Sélectionner une activité...", value: "" },
						...activities.map((a) => ({ label: a.name, value: a.id })),
					]}
					required
				/>
				<div className="flex items-end gap-4">
					<div className="flex-1">
						<Input
							label="Montant Total de la formation"
							type="number"
							value={totalAmount}
							onChange={(e) => setTotalAmount(Number(e.target.value))}
							suffix="DZD"
							required
						/>
					</div>
					<button
						type="button"
						onClick={distributeAmount}
						className="mb-1 px-4 py-3 bg-taysir-teal/5 text-taysir-teal rounded-xl text-xs font-bold uppercase hover:bg-taysir-teal/10 transition-colors"
					>
						Répartir
					</button>
				</div>
			</div>

			<div className="h-px bg-taysir-teal/5 my-2" />

			<div className="space-y-4">
				<div className="flex justify-between items-center px-1">
					<h3 className="text-sm font-black text-taysir-teal uppercase tracking-widest">
						Échéancier (Tranches)
					</h3>
					<button
						type="button"
						onClick={addTranche}
						className="flex items-center gap-1 text-xs font-bold text-taysir-accent hover:underline"
					>
						<Plus size={14} /> Ajouter une tranche
					</button>
				</div>

				<div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
					{tranches.map((tranche, index) => (
						<div
							key={index}
							className="flex items-center gap-3 p-4 bg-white border border-taysir-teal/10 rounded-2xl shadow-sm"
						>
							<div className="w-8 h-8 rounded-full bg-taysir-teal/5 flex items-center justify-center text-[10px] font-black text-taysir-teal">
								{index + 1}
							</div>
							<div className="flex-1">
								<Input
									label=""
									type="number"
									value={tranche.amount}
									onChange={(e) =>
										updateTranche(index, "amount", e.target.value)
									}
									placeholder="Montant"
									required
								/>
							</div>
							<div className="flex-1">
								<Input
									label=""
									type="date"
									value={tranche.dueDate}
									onChange={(e) =>
										updateTranche(index, "dueDate", e.target.value)
									}
									required
								/>
							</div>
							<button
								type="button"
								onClick={() => removeTranche(index)}
								disabled={tranches.length === 1}
								className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-20"
							>
								<Trash2 size={18} />
							</button>
						</div>
					))}
				</div>
			</div>

			<div className="pt-4">
				<SubmitButton isLoading={isPending} loadingText="Création du plan...">
					<Wallet size={20} />
					<span>Valider le plan financier</span>
				</SubmitButton>
			</div>
		</form>
	);
}
