import StaffClientView from "@/components/dashboard/staff/StaffClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getStaff } from "@/services/api";

export default async function StaffPage() {
	const staff = await getStaff();

	return (
		<DashboardLayout>
			<StaffClientView initialStaff={staff} />
		</DashboardLayout>
	);
}
