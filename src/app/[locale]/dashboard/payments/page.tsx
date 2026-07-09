import PaymentsClientView from "@/components/dashboard/payments/PaymentsClientView";
import {
	getActivities,
	getCurrentTenant,
	getLatestRelanceByStudent,
	getPayments,
	getStudents,
} from "@/services/api";

export default async function PaymentsPage() {
	const [payments, students, activities, tenant, relanceMap] =
		await Promise.all([
			getPayments(),
			getStudents(),
			getActivities(),
			getCurrentTenant(),
			getLatestRelanceByStudent(),
		]);

	return (
		<PaymentsClientView
			initialPayments={payments}
			students={students}
			activities={activities}
			schoolName={tenant?.name ?? ""}
			relanceMap={relanceMap}
		/>
	);
}
