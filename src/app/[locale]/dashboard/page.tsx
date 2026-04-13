import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardSPA from "@/components/dashboard/DashboardSPA";
import StatsWidget from "@/components/dashboard/widgets/StatsWidget";
import SessionsWidget from "@/components/dashboard/widgets/SessionsWidget";
import PaymentsWidget from "@/components/dashboard/widgets/PaymentsWidget";

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
      />
    </DashboardLayout>
  );
}
