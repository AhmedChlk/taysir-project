import AttendanceClientView from "@/components/dashboard/attendance/AttendanceClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
	getAttendance,
	getGroups,
	getSessions,
	getStudents,
} from "@/services/api";

export default async function AttendancePage() {
	const [sessions, students, groups, attendance] = await Promise.all([
		getSessions(),
		getStudents(),
		getGroups(),
		getAttendance(),
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
