"use client";

import { useState } from "react";
import { User as UserIcon, Shield, School as SchoolIcon, Bell } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from 'next-intl';
import ProfileSettings from "./ProfileSettings";
import SchoolSettings from "./SchoolSettings";
import SecuritySettings from "./SecuritySettings";
import PreferencesSettings from "./PreferencesSettings";

interface SettingsClientViewProps {
  user: any; // User type might need to match getCurrentUser select
  tenant: any;
}

export default function SettingsClientView({ user, tenant }: SettingsClientViewProps) {
  const [activeTab, setActiveTab] = useState("account");
  const t = useTranslations();

  const tabs = [
    { id: "account", label: t("tab_account"), icon: UserIcon },
    { id: "school", label: t("tab_school"), icon: SchoolIcon },
    { id: "security", label: t("tab_security"), icon: Shield },
    { id: "preferences", label: t("tab_preferences"), icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <ProfileSettings user={user} />;
      case "school":
        return <SchoolSettings tenant={tenant} />;
      case "security":
        return <SecuritySettings />;
      case "preferences":
        return <PreferencesSettings />;
      default:
        return <ProfileSettings user={user} />;
    }
  };

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      {/* Vertical Navigation Sidebar */}
      <aside className="w-full lg:w-72 shrink-0">
        <nav className="flex flex-col space-y-2 p-1 bg-gray-50/50 rounded-2xl border border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-3 py-3.5 px-4 text-sm font-semibold transition-all rounded-xl",
                activeTab === tab.id
                  ? "bg-white text-primary-teal shadow-sm border border-gray-200 ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              )}
            >
              <tab.icon 
                size={20} 
                className={clsx(
                  "transition-colors",
                  activeTab === tab.id ? "text-primary-teal" : "text-gray-400"
                )} 
              />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 p-6 bg-gradient-to-br from-primary-teal to-accent-teal rounded-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 end-0 -mt-4 -me-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{t("help_needed")}</p>
            <p className="text-sm font-medium">{t("help_subtitle")}</p>
            <button className="pt-2 text-xs font-bold underline hover:no-underline">
              {t("open_ticket")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}
