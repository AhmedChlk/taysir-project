import DashboardLayout from "@/components/layouts/DashboardLayout";
import GroupsClientView from "@/components/dashboard/groups/GroupsClientView";
import { getGroups, getActivities, getStaff } from "@/services/api";

export default async function GroupsPage() {
  const [groups, activities, staff] = await Promise.all([
    getGroups(),
    getActivities(),
    getStaff()
  ]);

  return (
    <DashboardLayout>
      <GroupsClientView 
        initialGroups={groups} 
        activities={activities} 
        staff={staff} 
      />
    </DashboardLayout>
  );
}
