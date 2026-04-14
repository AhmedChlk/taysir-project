import DashboardLayout from "@/components/layouts/DashboardLayout";
import ScheduleClientView from "@/components/dashboard/schedule/ScheduleClientView";
import { getRooms, getStaff, getActivities, getGroups } from "@/services/api";
import { getWeeklySessionsAction } from "@/actions/schedule.actions";
import { startOfWeek, endOfWeek } from "date-fns";

interface PageProps {
  searchParams: Promise<{ 
    date?: string;
    roomId?: string;
    instructorId?: string;
    groupId?: string;
  }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentDate = params.date ? new Date(params.date) : new Date();
  
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Récupération asynchrone des sessions avec filtres
  const sessionsResponse = await getWeeklySessionsAction({
    start,
    end,
    roomId: params.roomId,
    instructorId: params.instructorId,
    groupId: params.groupId,
  });

  const [rooms, staff, activities, groups] = await Promise.all([
    getRooms(),
    getStaff(),
    getActivities(),
    getGroups()
  ]);

  return (
    <DashboardLayout>
      <ScheduleClientView 
        initialSessions={sessionsResponse.success ? sessionsResponse.data : []}
        rooms={rooms}
        staff={staff}
        activities={activities}
        groups={groups}
        currentDate={currentDate}
      />
    </DashboardLayout>
  );
}
