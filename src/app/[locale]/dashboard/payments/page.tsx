import DashboardLayout from "@/components/layouts/DashboardLayout";
import PaymentsClientView from "@/components/dashboard/payments/PaymentsClientView";
import { getPayments, getStudents } from "@/services/api";

export default async function PaymentsPage() {
  const [payments, students] = await Promise.all([
    getPayments(),
    getStudents()
  ]);

  return (
    <DashboardLayout>
      <PaymentsClientView 
        initialPayments={payments.map(p => ({
          id: p.id,
          etablissementId: p.etablissementId,
          studentId: p.studentId,
          totalAmount: p.totalAmount,
          paidAmount: p.paidAmount,
          currency: p.currency,
          status: p.status
        }))}
        students={students}
      />
    </DashboardLayout>
  );
}
