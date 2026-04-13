"use client";

import { useTranslations } from 'next-intl';
import { Input } from "@/components/ui/FormInput";
import { Save, Shield } from "lucide-react";

export default function SecuritySettings() {
  const t = useTranslations();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="p-2.5 bg-primary-teal/10 rounded-lg text-primary-teal">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t("change_password")}</h3>
              <p className="text-xs text-gray-500">{t("security_settings_desc")}</p>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <Input 
              label={t("old_password")} 
              type="password" 
              placeholder="••••••••" 
            />
            <div className="space-y-6">
              <Input 
                label={t("new_password")} 
                type="password" 
                placeholder="••••••••" 
                helperText={t("min_8_chars")}
              />
              <Input 
                label={t("confirm_password")} 
                type="password" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
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
