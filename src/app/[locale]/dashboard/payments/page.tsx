import PaymentsClientView from "@/components/dashboard/payments/PaymentsClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getActivities, getPayments, getStudents } from "@/services/api";

export default async function PaymentsPage() {
	const [payments, students, activities] = await Promise.all([
		getPayments(),
		getStudents(),
		getActivities(),
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
