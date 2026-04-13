"use client";

import { useTranslations } from 'next-intl';
import { Input, Select, TextArea } from "@/components/ui/FormInput";
import { Save, Palette, School, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { updateSchoolAction } from "@/actions/settings.actions";

interface SchoolSettingsProps {
  tenant: any;
}

export default function SchoolSettings({ tenant }: SchoolSettingsProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleUpdateSchool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
    };

    startTransition(async () => {
      const result = await updateSchoolAction(data);
      if (result.success) {
        alert(t("save_success"));
      } else {
        alert(result.error.message);
      }
    });
  };

  if (!tenant) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <form onSubmit={handleUpdateSchool} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="p-2.5 bg-primary-teal/10 rounded-lg text-primary-teal">
              <School size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t("tab_school")}</h3>
              <p className="text-xs text-gray-500">{t("school_settings_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Input name="name" label={t("school_name")} defaultValue={tenant.name} required />
            <TextArea name="address" label={t("address")} defaultValue={tenant.address || ""} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Select 
                label={t("timezone")} 
                options={[{ label: "Alger (GMT+1)", value: "alg" }]} 
              />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Palette size={16} className="text-gray-400" /> {t("primary_color")}
                </label>
                <div className="flex items-center gap-3 p-1.5 rounded-lg border border-gray-100 bg-gray-50/50 w-fit">
                  <div className="h-8 w-16 rounded-md border border-white shadow-sm" style={{ backgroundColor: tenant.primaryColor || '#0F515C' }} />
                  <span className="text-sm font-mono text-gray-600 ps-1 pe-3 uppercase">{tenant.primaryColor || '#0F515C'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={isPending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
