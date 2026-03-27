import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardClientView from "@/components/dashboard/DashboardClientView";
import { 
  getStudents, 
  getActivities, 
  getRooms, 
  getSessions, 
  getAttendanceStats,
  getPayments 
} from "@/services/api";

export default async function DashboardPage() {
  const [students, activities, rooms, sessions, attendanceStats, payments] = await Promise.all([
    getStudents(),
    getActivities(),
    getRooms(),
    getSessions(),
    getAttendanceStats(),
    getPayments()
  ]);

  return (
    <DashboardLayout>
      <DashboardClientView 
        students={students}
        activities={activities}
        rooms={rooms}
        sessions={sessions}
        attendanceStats={attendanceStats}
        payments={payments}
      />
    </DashboardLayout>
  );
}
