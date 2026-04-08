"use client";

import { Payment, Student } from "@/types/schema";
import { CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

interface PaymentCardProps {
  payment: Payment;
  student: Student;
  onManage?: (payment: Payment) => void;
}

export default function PaymentCard({ payment, student, onManage }: PaymentCardProps) {
  const t = useTranslations();
  const totalAmount = payment?.totalAmount ?? 0;
  const paidAmount = payment?.paidAmount ?? 0;
  const percentPaid = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const remaining = totalAmount - paidAmount;

  const statusConfig = {
    PAID: {
      color: "text-green-600 bg-green-50 border-green-200",
      icon: <CheckCircle2 size={16} />,
      label: t("paid"),
      bar: "bg-green-500",
    },
    PARTIAL: {
      color: "text-orange-600 bg-orange-50 border-orange-200",
      icon: <Clock size={16} />,
      label: t("partial"),
      bar: "bg-orange-500",
    },
    PENDING: {
      color: "text-red-600 bg-red-50 border-red-200",
      icon: <AlertCircle size={16} />,
      label: t("pending"),
      bar: "bg-red-500",
    },
  };

  const config = statusConfig[payment?.status ?? "PENDING"] ?? statusConfig.PENDING;

  const firstNameChar = student?.firstName?.charAt(0) ?? "?";
  const lastNameChar = student?.lastName?.charAt(0) ?? "?";
  const currency = payment?.currency ?? "DA";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal font-bold text-lg">
            {firstNameChar}{lastNameChar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {student?.firstName ?? t("unknown")} {student?.lastName ?? ""}
            </h3>
            {student?.isMinor ? (
              <p className="text-[10px] text-orange-600 font-bold uppercase">
                Payé par : {student?.parentName || "Parent"}
              </p>
            ) : (
              <p className="text-xs text-gray-500">ID: {student?.id ?? "N/A"}</p>
            )}
          </div>
        </div>
        <span className={clsx("flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", config.color)}>
          {config.icon}
          {config.label}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("progression")}</span>
          <span className="font-semibold text-gray-900">{percentPaid}% ({paidAmount} {currency})</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div 
            className={clsx("h-full transition-all duration-500", config.bar)}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">{t("total")}</p>
            <p className="text-lg font-bold text-gray-900">{totalAmount} <span className="text-sm font-normal text-gray-500">{currency}</span></p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">{t("remaining")}</p>
            <p className="text-lg font-bold text-red-600">{remaining} <span className="text-sm font-normal text-gray-500">{currency}</span></p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onManage && payment ? onManage(payment) : undefined}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <CreditCard size={18} />
        {t("manage_payment")}
      </button>
    </div>
  );
}
