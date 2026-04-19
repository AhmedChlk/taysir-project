import RoomsClientView from "@/components/dashboard/rooms/RoomsClientView";
import { getRooms } from "@/services/api";

export default async function RoomsPage() {
	const rooms = await getRooms();

	return <RoomsClientView initialRooms={rooms} />;
}
