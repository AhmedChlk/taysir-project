import { getGroups, getActivities, getStaff } from "@/services/api";
import GroupsClientView from "@/components/dashboard/groups/GroupsClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default async function GroupsPage() {
  // On récupère tout en parallèle pour que ce soit ultra rapide
  const [groups, activities, staff] = await Promise.all([
    getGroups(),
    getActivities(),
    getStaff()
  ]);

  // Purification obligatoire pour Turbopack / Next.js 16
  const purifiedGroups = JSON.parse(JSON.stringify(groups || []));
  const purifiedActivities = JSON.parse(JSON.stringify(activities || []));
  const purifiedStaff = JSON.parse(JSON.stringify(staff || []));

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <GroupsClientView 
          initialGroups={purifiedGroups} 
          activities={purifiedActivities}
          staff={purifiedStaff}
        />
      </div>
    </DashboardLayout>
  );
}