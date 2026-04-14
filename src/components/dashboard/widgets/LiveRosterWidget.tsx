import { Users, UserCheck, UserX, Edit2, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';
import { getStaff } from '@/services/api';
import { cn } from '@/utils/format';
import { User } from '@/types/schema';

export default async function LiveRosterWidget() {
  const staff = await getStaff();
  
  return (
    <div className="col-span-1 md:col-span-8 bento-card p-8 flex flex-col gap-6 group hover:border-taysir-teal/20 transition-all duration-500 shadow-sm hover:shadow-xl relative overflow-hidden bg-white">
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h3 className="text-sm font-black text-taysir-teal uppercase tracking-[0.2em] flex items-center gap-2">
            <Users size={18} className="text-taysir-light" /> Équipage Établissement
          </h3>
          <p className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest mt-1">Disponibilité et accès en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
            {staff.filter((m: any) => m.status === 'ACTIVE').length} Actifs
          </span>
          <Link href="/dashboard/staff" className="p-2 bg-taysir-teal/5 rounded-xl text-taysir-teal hover:bg-taysir-teal hover:text-white transition-all">
            <Edit2 size={16} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        {staff.slice(0, 6).map((member: User) => (
          <div 
            key={member.id} 
            className="flex items-center justify-between p-4 rounded-2xl border border-taysir-teal/5 bg-taysir-bg/20 hover:bg-white hover:border-taysir-teal/20 hover:shadow-lg transition-all group/item"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-taysir-teal font-black text-lg uppercase overflow-hidden shadow-sm border border-taysir-teal/5">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.firstName} className="w-full h-full object-cover" />
                  ) : (
                    member.firstName[0] + (member.lastName ? member.lastName[0] : "")
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
                  member.status === 'ACTIVE' ? "bg-emerald-500" : member.status === 'ON_LEAVE' ? "bg-amber-500" : "bg-rose-500"
                )}>
                  {member.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
              </div>
              <div className="overflow-hidden">
                <div className="text-[13px] font-black text-taysir-teal truncate leading-tight uppercase tracking-tight">
                  {member.firstName} {member.lastName}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-black text-taysir-teal/30 uppercase tracking-[0.1em] px-1.5 py-0.5 bg-white rounded border border-taysir-teal/5 flex items-center gap-1">
                    <ShieldCheck size={8} /> {member.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
               <button className="p-2 rounded-lg bg-white text-taysir-teal hover:bg-taysir-teal hover:text-white transition-all shadow-sm">
                 <Mail size={12} />
               </button>
            </div>
          </div>
        ))}
      </div>
      
      {staff.length > 6 && (
        <div className="text-center pt-2">
          <Link href="/dashboard/staff" className="text-[10px] font-black text-taysir-teal/40 uppercase tracking-[0.3em] hover:text-taysir-teal transition-colors">
            Voir les {staff.length - 6} autres membres →
          </Link>
        </div>
      )}

      {/* Décoration asymétrique */}
      <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-taysir-teal/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
