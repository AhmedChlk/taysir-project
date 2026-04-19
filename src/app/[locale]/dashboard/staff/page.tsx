import StaffClientView from "@/components/dashboard/staff/StaffClientView";
import { getStaff } from "@/services/api";

export default async function StaffPage() {
	const staff = await getStaff();

	return <StaffClientView initialStaff={staff} />;
}
