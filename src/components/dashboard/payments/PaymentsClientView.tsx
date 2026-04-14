"use client";

import { useState, useMemo, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormInput";
import EmptyState from "@/components/ui/EmptyState";
import { Payment, Student, PaymentMethod, Activity } from "@/types/schema";
import { Search, Plus, Wallet, Calendar, CheckCircle2, AlertCircle, ArrowRight, Loader2, TrendingUp, DollarSign, Clock, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";
import { createPaymentPlanAction, registerPaymentAction } from "@/actions/finance.actions";
import { useRouter } from "@/i18n/routing";
import { clsx } from "clsx";

interface PaymentsClientViewProps {
  initialPayments: Payment[];
  students: Student[];
  activities: Activity[];
}

export default function PaymentsClientView({ initialPayments = [], students = [], activities = [] }: PaymentsClientViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedPaymentState, setSelectedPaymentState] = useState<Payment | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const router = useRouter();

  // Sync selected payment with updated props from router.refresh()
  const selectedPayment = useMemo(() => {
    if (!selectedPaymentState) return null;
    return initialPayments.find(p => p.id === selectedPaymentState.id) || selectedPaymentState;
  }, [initialPayments, selectedPaymentState]);

  // --- States for NEW Payment Plan ---
  const [newPlanStudentId, setNewPlanStudentId] = useState("");
  const [newPlanActivityId, setNewPlanActivityId] = useState("");
  const [newPlanTotal, setNewPlanTotal] = useState(0);
  const [tranchesCount, setTranchesCount] = useState(1);

  // --- States for REGISTERING a Payment ---
  const [selectedTrancheId, setSelectedTrancheId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, _setPaymentMethod] = useState<PaymentMethod>("CASH");

  const studentsMap = useMemo(() => {
    return (students || []).reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, Student>);
  }, [students]);

  const filteredPayments = useMemo(() => {
    return (initialPayments || []).filter(payment => {
      const student = studentsMap[payment.studentId];
      const studentName = formatFullName(student?.firstName, student?.lastName).toLowerCase();
      const nameMatch = studentName.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || payment.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [searchTerm, statusFilter, initialPayments, studentsMap]);

  const handleManage = (payment: Payment) => {
    setSelectedPaymentState(payment);
    setIsManageModalOpen(true);
    // Reset payment fields
    setSelectedTrancheId("");
    setPaymentAmount(0);
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanStudentId || !newPlanActivityId || newPlanTotal <= 0) return;

    // Create simple tranches automatically
    const trancheAmount = Math.floor(newPlanTotal / tranchesCount);
    const tranches = Array.from({ length: tranchesCount }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      return {
        amount: i === tranchesCount - 1 ? newPlanTotal - (trancheAmount * (tranchesCount - 1)) : trancheAmount,
        dueDate: date.toISOString().split('T')[0]
      };
    });

    startTransition(async () => {
      const result = await createPaymentPlanAction({
        studentId: newPlanStudentId,
        activityId: newPlanActivityId,
        totalAmount: newPlanTotal,
        currency: "DZD",
        tranches
      });

      if (result.success) {
        setIsAddModalOpen(false);
        setNewPlanStudentId("");
        setNewPlanActivityId("");
        setNewPlanTotal(0);
        setTranchesCount(1);
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const getMonthName = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrancheId || paymentAmount <= 0) return;

    startTransition(async () => {
      const result = await registerPaymentAction({
        trancheId: selectedTrancheId,
        montant_paye: paymentAmount,
        methode: paymentMethod,
      });

      if (result.success) {
        setPaymentAmount(0);
        setSelectedTrancheId("");
        router.refresh();
        
        if (selectedPayment) {
          const updatedTranches = selectedPayment.tranches?.map(t => {
             if (t.id === selectedTrancheId) {
                const isPaid = result.data.trancheStatut === "PAID";
                return { ...t, isPaid };
             }
             return t;
          });
          setSelectedPaymentState({
            ...selectedPayment,
            paidAmount: selectedPayment.paidAmount + paymentAmount,
            tranches: updatedTranches
          });
        }
      } else {
        alert(result.error.message);
      }
    });
  };

  const stats = useMemo(() => {
    const total = initialPayments.reduce((acc, p) => acc + p.totalAmount, 0);
    const paid = initialPayments.reduce((acc, p) => acc + p.paidAmount, 0);
    return { total, paid, remaining: total - paid };
  }, [initialPayments]);

  const exportToCSV = () => {
    const headers = ["Élève", "Activité", "Montant Total", "Montant Payé", "Reste", "Statut"];
    const rows = filteredPayments.map(p => {
      const student = studentsMap[p.studentId];
      const studentName = student ? formatFullName(student.firstName, student.lastName) : "Inconnu";
      return [
        `"${studentName}"`,
        `"${p.activity?.name || "N/A"}"`,
        p.totalAmount,
        p.paidAmount,
        p.totalAmount - p.paidAmount,
        p.status
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `paiements_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-sm">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("payments")}</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Gestion Financière & Échéanciers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white text-taysir-teal border border-taysir-teal/20 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-taysir-teal/5 transition-all shadow-sm"
          >
            <Download size={18} />
            Exporter CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2.5"
          >
            <Plus size={20} strokeWidth={2.5} />
            Nouveau Plan Financier
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Prévu</p>
            <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString()} DA</p>
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Encaissé</p>
            <p className="text-2xl font-black text-gray-900">{stats.paid.toLocaleString()} DA</p>
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reste à percevoir</p>
            <p className="text-2xl font-black text-red-600">{stats.remaining.toLocaleString()} DA</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un élève par nom..."
            className="block w-full rounded-2xl border-none bg-gray-50 py-3 pl-12 pr-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary-teal/5 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-2xl border border-gray-100 min-w-[200px]">
          <FilterIcon size={18} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="PAID">Payé</option>
            <option value="PARTIAL">Partiel</option>
            <option value="PENDING">En attente</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filteredPayments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayments.map(payment => {
            const student = studentsMap[payment.studentId];
            return student ? (
              <PaymentCardStyled 
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
          icon={DollarSign}
          title="Aucun plan financier trouvé"
          description="Créez un plan de paiement pour un élève afin de commencer le suivi."
          actionLabel="Créer un plan"
          onAction={() => setIsAddModalOpen(true)}
        />
      )}

      {/* Modal: Add New Payment Plan */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer un Plan Financier"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button 
              onClick={() => setIsAddModalOpen(false)} 
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl px-5 py-2.5 transition-all font-bold text-sm"
            >
              Annuler
            </button>
            <button 
              form="add-plan-form"
              type="submit"
              disabled={isPending || !newPlanStudentId || !newPlanActivityId || newPlanTotal <= 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isPending && <Loader2 size={18} className="animate-spin" />}
              Créer l&apos;échéancier
            </button>
          </div>
        }
      >
        <form id="add-plan-form" onSubmit={handleAddPlan} className="space-y-6 py-2">
           <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
              <Select 
                label="Élève concerné" 
                value={newPlanStudentId}
                onChange={(e) => setNewPlanStudentId(e.target.value)}
                options={[
                  { label: "Sélectionner un élève...", value: "" },
                  ...students.map(s => ({ label: formatFullName(s.firstName, s.lastName), value: s.id }))
                ]} 
                required
              />
              <Select 
                label="Activité associée" 
                value={newPlanActivityId}
                onChange={(e) => setNewPlanActivityId(e.target.value)}
                options={[
                  { label: "Sélectionner une activité...", value: "" },
                  ...activities.map(a => ({ label: a.name, value: a.id }))
                ]} 
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Montant Total (DA)" 
                  type="number" 
                  value={newPlanTotal}
                  onChange={(e) => setNewPlanTotal(Number(e.target.value))}
                  placeholder="Ex: 15000" 
                  required
                />
                <Input 
                  label="Nombre de tranches" 
                  type="number" 
                  min="1"
                  max="12"
                  value={tranchesCount}
                  onChange={(e) => setTranchesCount(Number(e.target.value))}
                  placeholder="Ex: 3" 
                  required
                />
              </div>
           </div>
           <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
             <Calendar size={18} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-xs text-blue-700 font-medium leading-relaxed">
               Les tranches seront automatiquement espacées d&apos;un mois à partir d&apos;aujourd&apos;hui. Vous pourrez les modifier individuellement par la suite.
             </p>
          </div>
        </form>
      </Modal>

      {/* Modal: Manage Payment / Echeancier */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Détails de l&apos;échéancier"
        footer={
          <div className="flex items-center justify-end w-full">
            <button onClick={() => setIsManageModalOpen(false)} className="btn-primary text-sm">Terminer</button>
          </div>
        }
      >
        <div className="space-y-8 py-2">
          {/* Header Info */}
          <div className="flex items-center justify-between bg-gradient-to-br from-primary-teal to-accent-teal p-6 rounded-[32px] text-white shadow-lg">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Reste à payer</p>
                <p className="text-3xl font-black">{(selectedPayment?.totalAmount || 0) - (selectedPayment?.paidAmount || 0)} DA</p>
             </div>
             <div className="text-right">
                <p className="text-sm font-bold">{formatFullName(studentsMap[selectedPayment?.studentId || '']?.firstName, studentsMap[selectedPayment?.studentId || '']?.lastName)}</p>
                <p className="text-[10px] font-medium opacity-70 italic">Plan ID: {selectedPayment?.id.split('-')[0]}</p>
             </div>
          </div>

          {/* Register New Payment Form */}
          <form onSubmit={handleRegisterPayment} className="space-y-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <DollarSign size={14} className="text-green-500" />
               Enregistrer un règlement
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <select
                  value={selectedTrancheId}
                  onChange={(e) => {
                    setSelectedTrancheId(e.target.value);
                    const t = selectedPayment?.tranches?.find(tr => tr.id === e.target.value);
                    if (t) setPaymentAmount(t.amount);
                  }}
                  className="w-full bg-gray-50 rounded-xl border-gray-100 py-2.5 px-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary-teal/5"
                  required
                >
                  <option value="">Choisir une tranche...</option>
                  {selectedPayment?.tranches?.filter(t => !t.isPaid).map(tranche => (
                    <option key={tranche.id} value={tranche.id}>
                      Mois: {getMonthName(tranche.dueDate)} ({tranche.amount} DA)
                    </option>
                  ))}
                </select>
              </div>
              <input 
                type="number"
                placeholder="Montant (DA)"
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full bg-gray-50 rounded-xl border-gray-100 py-2.5 px-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary-teal/5"
                required
              />
              <button 
                type="submit"
                disabled={isPending || !selectedTrancheId || paymentAmount <= 0}
                className="btn-primary flex items-center justify-center gap-2 py-2.5 px-4 disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Valider
              </button>
            </div>
          </form>

          {/* Echeancier (Timeline) */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
               <Calendar size={14} className="text-primary-teal" />
               Échéancier Mensuel (Timeline)
            </h4>
            <div className="space-y-3">
              {selectedPayment?.tranches?.map((tranche) => (
                <div key={tranche.id} className={clsx(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  tranche.isPaid ? "bg-green-50/50 border-green-100 opacity-70" : "bg-white border-gray-100 shadow-sm"
                )}>
                  <div className={clsx(
                    "flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl font-black text-xs",
                    tranche.isPaid ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    <span>{new Date(tranche.dueDate).getDate()}</span>
                    <span className="uppercase text-[10px]">{new Date(tranche.dueDate).toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{tranche.amount.toLocaleString()} DA</p>
                    <p className="text-[10px] font-medium text-gray-500">{getMonthName(tranche.dueDate)} • {tranche.isPaid ? 'Payée' : 'À régler'}</p>
                  </div>
                  {tranche.isPaid ? (
                    <div className="p-2 bg-green-500 text-white rounded-full">
                      <CheckCircle2 size={16} />
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 text-gray-400 rounded-full">
                      <Clock size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Internal Styled Card
function PaymentCardStyled({ payment, student, onManage }: { payment: Payment, student: Student, onManage: (p: Payment) => void }) {
  const percent = payment.totalAmount > 0 ? Math.round((payment.paidAmount / payment.totalAmount) * 100) : 0;
  const paidTranches = payment.tranches?.filter(t => t.isPaid).length || 0;
  const totalTranches = payment.tranches?.length || 0;
  
  return (
    <div className="group bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-teal/20 transition-all duration-300">
       <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-black text-primary-teal text-lg border border-gray-100 shadow-inner group-hover:scale-110 transition-transform">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
             </div>
             <div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">{student.firstName} {student.lastName}</h3>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{student.email ? student.email.split('@')[0] : 'Élève'}</p>
                  <p className="text-[10px] font-bold text-primary-teal/70 uppercase tracking-tight mt-0.5">{paidTranches}/{totalTranches} mois réglés</p>
                  {payment.activity && (
                    <p className="text-[9px] font-bold bg-primary-teal/5 text-primary-teal px-1.5 py-0.5 rounded-md mt-1 self-start">
                      {payment.activity.name}
                    </p>
                  )}
                </div>
             </div>
          </div>
          <div className={clsx(
            "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
            payment.status === 'PAID' ? "bg-green-50 text-green-600 border border-green-100" :
            payment.status === 'PARTIAL' ? "bg-orange-50 text-orange-600 border border-orange-100" :
            "bg-red-50 text-red-600 border border-red-100"
          )}>
            {payment.status === 'PAID' ? 'Soldé' : payment.status === 'PARTIAL' ? 'Partiel' : 'Dû'}
          </div>
       </div>

       <div className="space-y-4">
          <div className="flex justify-between items-end">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encaissé</p>
                <p className="text-xl font-black text-gray-900">{payment.paidAmount.toLocaleString()} <span className="text-xs font-bold text-gray-400">DA</span></p>
             </div>
             <p className="text-xs font-black text-primary-teal">{percent}%</p>
          </div>
          
          <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
             <div 
                className="h-full bg-primary-teal rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${percent}%` }}
             />
          </div>

          <div className="flex justify-between py-2 border-t border-gray-50 mt-2">
             <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Total</p>
                <p className="text-xs font-bold text-gray-700">{payment.totalAmount.toLocaleString()} DA</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Reste</p>
                <p className="text-xs font-bold text-red-500">{(payment.totalAmount - payment.paidAmount).toLocaleString()} DA</p>
             </div>
          </div>
       </div>

       <button 
         onClick={() => onManage(payment)}
         className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest"
       >
         Gérer l&apos;échéancier
         <ArrowRight size={14} strokeWidth={3} />
       </button>
    </div>
  );
}

function FilterIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
