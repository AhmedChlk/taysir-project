import RoomsClientView from "@/components/dashboard/rooms/RoomsClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getRooms } from "@/services/api";

export default async function RoomsPage() {
	const rooms = await getRooms();

	return (
		<DashboardLayout>
			<RoomsClientView initialRooms={rooms} />
		</DashboardLayout>
	);
}
