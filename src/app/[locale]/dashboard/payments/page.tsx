import PaymentsClientView from "@/components/dashboard/payments/PaymentsClientView";
import { getActivities, getPayments, getStudents } from "@/services/api";

export default async function PaymentsPage() {
	const [payments, students, activities] = await Promise.all([
		getPayments(),
		getStudents(),
		getActivities(),
	]);

	return (
		<PaymentsClientView
			initialPayments={payments}
			students={students}
			activities={activities}
		/>
	);
}
