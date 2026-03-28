import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Settings } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getCurrentTenant } from "@/services/api";

// Sub-components
import SettingsClientView from "@/components/dashboard/settings/SettingsClientView";

export default async function SettingsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const tenant = await getCurrentTenant();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="text-primary-teal" size={28} />
            {t("settings")}
          </h1>
          <p className="text-gray-500 text-lg">
            {t("settings_subtitle")}
          </p>
        </div>

        <SettingsClientView user={user} tenant={tenant} />
      </div>
    </DashboardLayout>
  );
}
