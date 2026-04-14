import DashboardLayout from "@/components/layouts/DashboardLayout";
import PaymentsClientView from "@/components/dashboard/payments/PaymentsClientView";
import { getPayments, getStudents, getActivities } from "@/services/api";

export default async function PaymentsPage() {
  const [payments, students, activities] = await Promise.all([
    getPayments(),
    getStudents(),
    getActivities()
  ]);

  return (
    <DashboardLayout>
      <PaymentsClientView 
        initialPayments={payments}
        students={students}
        activities={activities}
      />
    </DashboardLayout>
  );
}
