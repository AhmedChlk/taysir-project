import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";

export default async function Home() {
	const session = await getServerSession(authOptions);
	const locale = await getLocale();

	if (!session) {
		redirect(`/${locale}/login`);
	} else if (session.user.role === "SUPER_ADMIN") {
		redirect(`/${locale}/superadmin`);
	} else {
		redirect(`/${locale}/dashboard`);
	}
}
