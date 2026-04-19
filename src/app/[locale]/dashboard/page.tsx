import DashboardSPA from "@/components/dashboard/DashboardSPA";
import LiveRosterWidget from "@/components/dashboard/widgets/LiveRosterWidget";
import PaymentsWidget from "@/components/dashboard/widgets/PaymentsWidget";
import PerformanceKPIsWidget from "@/components/dashboard/widgets/PerformanceKPIsWidget";
import SessionsWidget from "@/components/dashboard/widgets/SessionsWidget";
import StaffAlertsWidget from "@/components/dashboard/widgets/StaffAlertsWidget";
import StatsWidget from "@/components/dashboard/widgets/StatsWidget";

interface PageProps {
	params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
	const { locale } = await params;

	return (
		<DashboardSPA
			locale={locale}
			stats={<StatsWidget />}
			sessions={<SessionsWidget />}
			payments={<PaymentsWidget />}
			kpis={<PerformanceKPIsWidget />}
			roster={<LiveRosterWidget />}
			alerts={<StaffAlertsWidget />}
		/>
	);
}
