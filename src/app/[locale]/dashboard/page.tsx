import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardSPA from "@/components/dashboard/DashboardSPA";
import StatsWidget from "@/components/dashboard/widgets/StatsWidget";
import SessionsWidget from "@/components/dashboard/widgets/SessionsWidget";
import PaymentsWidget from "@/components/dashboard/widgets/PaymentsWidget";
import PerformanceKPIsWidget from "@/components/dashboard/widgets/PerformanceKPIsWidget";
import LiveRosterWidget from "@/components/dashboard/widgets/LiveRosterWidget";
import StaffAlertsWidget from "@/components/dashboard/widgets/StaffAlertsWidget";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <DashboardLayout>
      <DashboardSPA 
        locale={locale}
        stats={<StatsWidget />}
        sessions={<SessionsWidget />}
        payments={<PaymentsWidget />}
        kpis={<PerformanceKPIsWidget />}
        roster={<LiveRosterWidget />}
        alerts={<StaffAlertsWidget />}
      />
    </DashboardLayout>
  );
}
