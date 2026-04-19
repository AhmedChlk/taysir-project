import GroupsClientView from "@/components/dashboard/groups/GroupsClientView";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
	getActivities,
	getGroups,
	getStaff,
	getStudents,
} from "@/services/api";

export default async function GroupsPage() {
	const [groups, activities, staff, students] = await Promise.all([
		getGroups(),
		getActivities(),
		getStaff(),
		getStudents(),
	]);

	return (
		<DashboardLayout>
			<GroupsClientView
				initialGroups={groups}
				activities={activities}
				staff={staff}
				students={students}
			/>
		</DashboardLayout>
	);
}
