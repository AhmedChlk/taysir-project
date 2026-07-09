import RoomsClientView from "@/components/dashboard/rooms/RoomsClientView";
import { getRoomsWithUsage } from "@/services/api";

export default async function RoomsPage() {
	const rooms = await getRoomsWithUsage();

	return <RoomsClientView initialRooms={rooms} />;
}
