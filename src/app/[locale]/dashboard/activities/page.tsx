import ActivitiesClientView from "@/components/dashboard/activities/ActivitiesClientView";
import { getActivitiesWithUsage } from "@/services/api";

export default async function ActivitiesPage() {
	const activities = await getActivitiesWithUsage();

	return <ActivitiesClientView initialActivities={activities} />;
}
