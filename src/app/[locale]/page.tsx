import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
	const session = await getServerSession(authOptions);
	const locale = await getLocale();

	if (!session) {
		return <LandingPage locale={locale} />;
	} else if (session.user.role === "SUPER_ADMIN") {
		redirect(`/${locale}/superadmin`);
	} else {
		redirect(`/${locale}/dashboard`);
	}
}
