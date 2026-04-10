"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import PaymentCard from "@/components/ui/PaymentCard";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormInput";
import EmptyState from "@/components/ui/EmptyState";
import { Payment, Student } from "@/types/schema";
import { Search, Plus, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";
import { createPaymentAction, updatePaymentAction } from "@/actions/finance.actions";

interface PaymentsClientViewProps {
  initialPayments: Payment[];
  students: Student[];
}

export default function PaymentsClientView({ initialPayments = [], students = [] }: PaymentsClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  // On utilise directement initialPayments pour que la page reflète la DB au rafraîchissement
  const payments = initialPayments || []; 

  const studentsMap = useMemo(() => {
    return (students || []).reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, Student>);
  }, [students]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const student = studentsMap[payment.studentId];
      const studentName = formatFullName(student?.firstName, student?.lastName).toLowerCase();
      const nameMatch = studentName.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || payment.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [searchTerm, statusFilter, payments, studentsMap]);

  const handleManage = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsManageModalOpen(true);
  };

  const studentOptions = (students || []).map(s => ({ 
    label: formatFullName(s?.firstName, s?.lastName) || t("unknown"), 
    value: s?.id ?? "" 
  }));

  // === FONCTIONS D'ENREGISTREMENT VERS LA BASE DE DONNÉES ===

  const handleAddPayment = async (formData: FormData) => {
    const studentId = formData.get("studentId") as string;
    const amount = formData.get("amount") as string;
    const paidAmount = formData.get("paidAmount") as string;
    
    if (!studentId || !amount) {
      alert("⚠️ Veuillez sélectionner un élève et indiquer un montant.");
      return;
    }

    startTransition(async () => {
      const result = await createPaymentAction({
        studentId,
        amount,
        paidAmount,
      });

      if (result?.success) {
        setIsAddModalOpen(false);
        router.refresh(); 
      } else {
        alert("❌ Erreur : " + result?.error?.message);
      }
    });
  };
  
  const handleUpdatePayment = async (formData: FormData) => {
    if (!selectedPayment) return;
    const amount = formData.get("addedAmount") as string;

    startTransition(async () => {
      // Pour l'exemple d'une mise à jour de paiement
      const result = await updatePaymentAction({
        id: selectedPayment.id,
        amount: Number(selectedPayment.totalAmount) + Number(amount),
      });

      if (result?.success) {
        setIsManageModalOpen(false);
        setSelectedPayment(null);
        router.refresh();
      } else {
        alert("❌ Erreur : " + result?.error?.message);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("payments")}</h1>
          <p className="text-sm text-gray-500">{t("groups_subtitle")}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-teal/90 transition-colors"
        >
          <Plus size={20} />
          {t("add")}
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center overflow-hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t("search")}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 focus:border-primary-teal focus:outline-none focus:ring-1 focus:ring-primary-teal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-primary-teal"
        >
          <option value="all">{t("status_header")}</option>
          <option value="ACTIVE">{t("active")}</option>
          <option value="PENDING">{t("inactive")}</option>
        </select>
      </div>

      {filteredPayments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayments.map(payment => {
            const student = studentsMap[payment.studentId];
            return student ? (
              <PaymentCard 
                key={payment.id} 
                payment={payment} 
                student={student} 
                onManage={handleManage}
              />
            ) : null;
          })}
        </div>
      ) : (
        <EmptyState 
          icon={CreditCard}
          title={t("no_results")}
          description={t("empty_list_desc")}
          actionLabel={t("add")}
          onAction={() => setIsAddModalOpen(true)}
        />
      )}

      {/* === MODAL : AJOUTER UN PAIEMENT === */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("add")}
        footer={
          <>
            <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              {t("cancel")}
            </button>
            {/* Ce bouton déclenche le formulaire lié par l'ID "add-payment-form" */}
            <button type="submit" form="add-payment-form" disabled={isPending} className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors disabled:opacity-50">
              {isPending ? "..." : t("save")}
            </button>
          </>
        }
      >
        <form id="add-payment-form" action={handleAddPayment} className="space-y-4">
          <Select 
            name="studentId" 
            label={t("total_students")} 
            options={studentOptions} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input name="amount" label={t("amount")} type="number" placeholder="Ex: 5000" />
            <Input name="paidAmount" label={t("paid_amount")} type="number" placeholder="Ex: 2500" />
          </div>
          <Select 
            name="method"
            label={t("role_header")} 
            options={[
              { label: "Espèces", value: "CASH" },
              { label: "Carte Bancaire", value: "CARD" },
              { label: "Virement", value: "TRANSFER" },
            ]} 
          />
        </form>
      </Modal>

      {/* === MODAL : GÉRER LE PAIEMENT (MODIFIER) === */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title={t("edit_member")}
        footer={
          <>
            <button onClick={() => setIsManageModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              {t("cancel")}
            </button>
            <button type="submit" form="update-payment-form" disabled={isPending} className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors disabled:opacity-50">
              {isPending ? "..." : t("save")}
            </button>
          </>
        }
      >
        <form id="update-payment-form" action={handleUpdatePayment} className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
            <p className="text-sm text-blue-800">
              {t("remaining")} : <span className="font-bold">{(selectedPayment?.totalAmount || 0) - (selectedPayment?.paidAmount || 0)} DZD</span>
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2 text-sm">{t("add")}</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input name="addedAmount" label={t("amount")} type="number" placeholder="Ex: 1000" />
              <Select 
                name="methodUpdate"
                label={t("role_header")} 
                options={[
                  { label: "Espèces", value: "CASH" },
                  { label: "Carte", value: "CARD" },
                ]} 
              />
            </div>
            <Input name="paymentDate" label={t("days_mon")} type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </form>
      </Modal>
    </div>
  );
}