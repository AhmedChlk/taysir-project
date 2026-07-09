import { getServerSession } from "next-auth/next";
import DirectorCockpit from "@/components/dashboard/DirectorCockpit";
import SecretaryCockpit from "@/components/dashboard/SecretaryCockpit";
import TeacherCockpit from "@/components/dashboard/TeacherCockpit";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);
	const role = session?.user.role;
	// Chaque rôle a son accueil : l'enseignant son espace (ses séances), la
	// secrétaire son guichet (caisse + inscriptions), les autres le pilotage.
	if (role === "INTERVENANT") {
		return <TeacherCockpit />;
	}
	if (role === "SECRETAIRE") {
		return <SecretaryCockpit />;
	}
	return <DirectorCockpit />;
}
