import DashboardLayout from "@/components/layouts/DashboardLayout";
import RoomsClientView from "@/components/dashboard/rooms/RoomsClientView";
import { getRooms } from "@/services/api";

export default async function RoomsPage() {
  const rooms = await getRooms();
  
  // LA LIGNE SALVATRICE : Transforme l'objet Prisma complexe en objet JS pur
  const plainRooms = JSON.parse(JSON.stringify(rooms));

  return (
    <DashboardLayout>
      <RoomsClientView initialRooms={plainRooms} />
    </DashboardLayout>
  );
}