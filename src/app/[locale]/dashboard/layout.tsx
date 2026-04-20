import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import DashboardShell from "@/components/layouts/DashboardLayout";
import { authOptions } from "@/lib/auth";

export default async function DashboardRootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const session = await getServerSession(authOptions);
	if (!session) {
		redirect(`/${locale}/login`);
	}
    if (session.user.role === "SUPER_ADMIN") {
        redirect(`/${locale}/superadmin`);
    }
	return <DashboardShell>{children}</DashboardShell>;
}
