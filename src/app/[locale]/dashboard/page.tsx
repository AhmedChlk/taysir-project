import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardSPA from "@/components/dashboard/DashboardSPA";
import StatsWidget from "@/components/dashboard/widgets/StatsWidget";
import SessionsWidget from "@/components/dashboard/widgets/SessionsWidget";
import PaymentsWidget from "@/components/dashboard/widgets/PaymentsWidget";
import PerformanceKPIsWidget from "@/components/dashboard/widgets/PerformanceKPIsWidget";
import LiveRosterWidget from "@/components/dashboard/widgets/LiveRosterWidget";
import StaffAlertsWidget from "@/components/dashboard/widgets/StaffAlertsWidget";
import { getDashboardFormDataAction } from "@/actions/dashboard.actions";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const formDataResponse = await getDashboardFormDataAction({});
  const formData = formDataResponse.success ? formDataResponse.data : {
    rooms: [], 
    activities: [], 
    staff: [], 
    groups: [], 
    students: [],
    todaySessions: [],
    pendingPayments: [],
    totalPendingAmount: 0
  };

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
        formData={formData}
      />
    </DashboardLayout>
  );
}
