import DashboardLayout from "@/components/layouts/DashboardLayout";
import StaffClientView from "@/components/dashboard/staff/StaffClientView";
import { getStaff } from "@/services/api";

export default async function StaffPage() {
  const staff = await getStaff();
  
  // Correction pour la sérialisation Prisma
  const plainStaff = JSON.parse(JSON.stringify(staff));

  return (
    <DashboardLayout>
      <StaffClientView initialStaff={plainStaff} />
    </DashboardLayout>
  );
}