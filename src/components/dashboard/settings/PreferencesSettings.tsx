"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Toggle } from "@/components/ui/Toggle";
import { Bell, Save } from "lucide-react";

export default function PreferencesSettings() {
  const t = useTranslations();
  const [prefs, setPrefs] = useState({
    email: true,
    weekly: false,
    dark: false,
    sms: true,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="p-2.5 bg-primary-teal/10 rounded-lg text-primary-teal">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t("tab_preferences")}</h3>
              <p className="text-xs text-gray-500">{t("preferences_settings_desc")}</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-4 divide-y divide-gray-50">
            <Toggle 
              label={t("pref_email_notifications")}
              description={t("pref_email_desc")}
              enabled={prefs.email}
              onChange={(v) => setPrefs({...prefs, email: v})}
            />
            <Toggle 
              label={t("pref_weekly_report")}
              description={t("pref_weekly_desc")}
              enabled={prefs.weekly}
              onChange={(v) => setPrefs({...prefs, weekly: v})}
            />
            <Toggle 
              label={t("pref_sms_alerts")}
              description={t("pref_sms_desc")}
              enabled={prefs.sms}
              onChange={(v) => setPrefs({...prefs, sms: v})}
            />
            <Toggle 
              label={t("pref_dark_mode")}
              description={t("pref_dark_desc")}
              enabled={prefs.dark}
              onChange={(v) => setPrefs({...prefs, dark: v})}
            />
          </div>

          <div className="flex justify-end pt-8">
            <button className="btn-primary flex items-center gap-2">
              <Save size={18} />
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
