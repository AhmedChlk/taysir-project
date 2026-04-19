import StudentsClientView from "@/components/dashboard/students/StudentsClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getGroups, getStudents } from "@/services/api";

export default async function StudentsPage() {
	const [students, groups] = await Promise.all([getStudents(), getGroups()]);

	return (
		<DashboardLayout>
			<StudentsClientView initialStudents={students} groups={groups} />
		</DashboardLayout>
	);
}
