"use client";

import { useTranslations } from 'next-intl';
import { Input, TextArea } from "@/components/ui/FormInput";
import { Save, Palette, School, Loader2, MapPin } from "lucide-react";
import { useTransition, useState } from "react";
import { updateSchoolAction } from "@/actions/settings.actions";
import { motion } from 'framer-motion';

interface SchoolSettingsProps {
  tenant: any;
}

export default function SchoolSettings({ tenant }: SchoolSettingsProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(tenant?.primaryColor || '#0F515C');

  const handleUpdateSchool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      primaryColor: color,
    };

    startTransition(async () => {
      const result = await updateSchoolAction(data);
      if (result.success) {
        // Optionnel : Notification Toast
      } else {
        alert(result.error.message);
      }
    });
  };

  if (!tenant) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-[32px] border border-taysir-teal/5 shadow-xl overflow-hidden">
        <form onSubmit={handleUpdateSchool} className="p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-4 pb-8 border-b border-taysir-teal/5">
            <div className="p-4 bg-taysir-teal/5 rounded-2xl text-taysir-teal">
              <School size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-taysir-teal uppercase tracking-tighter leading-none">Configuration Établissement</h3>
              <p className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-[0.2em] mt-2">Identité visuelle et informations légales</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Input name="name" label="Nom de l'école" defaultValue={tenant.name} required />
              <TextArea 
                name="address" 
                label="Adresse Physique" 
                defaultValue={tenant.address || ""} 
                placeholder="Ex: 12 Rue des Martyrs, Alger"
              />
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-taysir-bg/50 rounded-3xl border border-taysir-teal/5">
                <label className="text-xs font-black text-taysir-teal/40 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Palette size={14} /> Identité Visuelle
                </label>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-black text-taysir-teal uppercase tracking-tight">{color}</div>
                      <div className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest">Couleur Principale</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {['#0F515C', '#1A7A89', '#FE7F2D', '#2B2D42', '#8D99AE'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "h-8 rounded-lg border-2 transition-all",
                          color === c ? "border-taysir-teal scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-taysir-teal rounded-3xl text-white shadow-lg shadow-taysir-teal/20 relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Aperçu Branding</div>
                    <div className="text-xl font-black uppercase tracking-tighter mb-4">{tenant.name}</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                       <MapPin size={12} className="opacity-40" /> {tenant.address || 'Alger, DZ'}
                    </div>
                 </div>
                 <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <School size={100} />
                 </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-taysir-teal/5">
            <button 
              type="submit"
              disabled={isPending}
              className="btn-primary flex items-center gap-3 px-8 py-4 shadow-xl shadow-taysir-teal/10"
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span className="uppercase tracking-widest text-xs">Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// Helper pour concaténer les classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
