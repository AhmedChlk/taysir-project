import DashboardLayout from "@/components/layouts/DashboardLayout";
import AttendanceClientView from "@/components/dashboard/attendance/AttendanceClientView";
import { getSessions, getStudents, getGroups, getAttendance } from "@/services/api";

export default async function AttendancePage() {
  const [sessions, students, groups, attendance] = await Promise.all([
    getSessions(),
    getStudents(),
    getGroups(),
    getAttendance()
  ]);

  return (
    <DashboardLayout>
      <AttendanceClientView 
        sessions={sessions}
        students={students}
        groups={groups}
        initialAttendance={attendance}
      />
    </DashboardLayout>
  );
}
