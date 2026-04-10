import DashboardLayout from "@/components/layouts/DashboardLayout";
import ActivitiesClientView from "@/components/dashboard/activities/ActivitiesClientView";
import { getActivities } from "@/services/api";

export default async function ActivitiesPage() {
  const activities = await getActivities();

  // Correction pour la sérialisation Prisma
  const plainActivities = JSON.parse(JSON.stringify(activities));

  return (
    <DashboardLayout>
      <ActivitiesClientView initialActivities={plainActivities} />
    </DashboardLayout>
  );
}