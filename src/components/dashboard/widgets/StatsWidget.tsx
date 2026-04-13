import { Users } from 'lucide-react';
import { getDashboardStatsAction } from '@/actions/dashboard.actions';

export default async function StatsWidget() {
  const response = await getDashboardStatsAction({});
  
  if (!response.success) {
    return <div className="bento-card p-8 text-red-500">Erreur lors du chargement des statistiques.</div>;
  }

  const { total, active } = response.data;

  return (
    <div className="col-span-1 md:col-span-8 bg-taysir-teal rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl group">
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 opacity-70 mb-4">
            <Users size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">Effectif Global</span>
          </div>
          <h2 className="text-7xl md:text-8xl font-black tracking-tighter">
            {total}<span className="text-white/50 text-3xl ml-2 italic font-normal">élèves</span>
          </h2>
          <div className="flex gap-4 mt-4">
             <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
               {active} Actifs
             </span>
             <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
               {total - active} En attente
             </span>
          </div>
        </div>
        
        <div className="mt-12 flex gap-3">
          <button className="bg-white text-taysir-teal px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
            Gérer les inscriptions
          </button>
          <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
            Exporter
          </button>
        </div>
      </div>
      
      {/* Décoration asymétrique */}
      <div className="absolute -right-10 -top-10 w-64 h-64 bg-taysir-light/20 rounded-full blur-3xl group-hover:bg-taysir-accent/20 transition-colors duration-700" />
      <div className="absolute right-10 bottom-10 opacity-10 group-hover:opacity-20 transition-opacity">
        <Users size={200} />
      </div>
    </div>
  );
}
