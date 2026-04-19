import StudentsClientView from "@/components/dashboard/students/StudentsClientView";
import { getGroups, getStudents } from "@/services/api";

export default async function StudentsPage() {
	const [students, groups] = await Promise.all([getStudents(), getGroups()]);

	return <StudentsClientView initialStudents={students} groups={groups} />;
}
