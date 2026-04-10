import DashboardLayout from "@/components/layouts/DashboardLayout";
import StudentsClientView from "@/components/dashboard/students/StudentsClientView";
import { getStudents, getGroups } from "@/services/api";

export default async function StudentsPage() {
  const [students, groups] = await Promise.all([
    getStudents(),
    getGroups()
  ]);

  // Correction pour la sérialisation Prisma
  const plainStudents = JSON.parse(JSON.stringify(students));
  const plainGroups = JSON.parse(JSON.stringify(groups));

  return (
    <DashboardLayout>
      <StudentsClientView initialStudents={plainStudents} groups={plainGroups} />
    </DashboardLayout>
  );
}