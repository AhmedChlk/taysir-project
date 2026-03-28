import DashboardLayout from "@/components/layouts/DashboardLayout";
import ActivitiesClientView from "@/components/dashboard/activities/ActivitiesClientView";
import { getActivities } from "@/services/api";

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <DashboardLayout>
      <ActivitiesClientView initialActivities={activities} />
    </DashboardLayout>
  );
}
