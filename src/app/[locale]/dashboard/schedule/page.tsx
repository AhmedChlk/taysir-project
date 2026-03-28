import DashboardLayout from "@/components/layouts/DashboardLayout";
import ScheduleClientView from "@/components/dashboard/schedule/ScheduleClientView";
import { getSessions, getRooms, getStaff, getActivities, getGroups } from "@/services/api";

export default async function SchedulePage() {
  const [sessions, rooms, staff, activities, groups] = await Promise.all([
    getSessions(),
    getRooms(),
    getStaff(),
    getActivities(),
    getGroups()
  ]);

  return (
    <DashboardLayout>
      <ScheduleClientView 
        sessions={sessions}
        rooms={rooms}
        staff={staff}
        activities={activities}
        groups={groups}
      />
    </DashboardLayout>
  );
}
