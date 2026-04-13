import { Calendar, ArrowUpRight } from 'lucide-react';
import { getTodaySessionsAction } from '@/actions/dashboard.actions';
import Link from 'next/link';

export default async function SessionsWidget() {
  const response = await getTodaySessionsAction({});
  
  if (!response.success) {
    return <div className="bento-card p-8 text-red-500">Erreur chargement séances.</div>;
  }

  const sessions = response.data;

  return (
    <div className="col-span-1 md:col-span-4 bento-card p-8 flex flex-col justify-between group hover:border-taysir-teal/20 transition-all duration-500 shadow-sm hover:shadow-xl">
      <div className="flex justify-between items-start">
        <div className="p-4 bg-taysir-teal/5 rounded-2xl text-taysir-teal group-hover:bg-taysir-teal group-hover:text-white transition-colors duration-500">
          <Calendar size={24} />
        </div>
        <span className="text-taysir-light font-black text-sm flex items-center gap-1 bg-taysir-teal/5 px-3 py-1 rounded-full uppercase tracking-tighter">
          Aujourd&apos;hui
        </span>
      </div>
      
      <div className="mt-8">
        <div className="text-5xl font-black text-taysir-teal tracking-tighter mb-1 transition-transform group-hover:scale-105 origin-left">
          {sessions.length}
        </div>
        <h3 className="text-xl font-bold text-taysir-teal/80 uppercase tracking-tighter">Séances prévues</h3>
        <p className="text-sm text-taysir-teal/50 mt-2 font-medium">
          {sessions.length > 0 
            ? `Répartition sur ${new Set(sessions.map((s: { roomId: string }) => s.roomId)).size} salles.` 
            : 'Aucune séance programmée.'}
        </p>
      </div>

      <Link 
        href="?drawer=sessions"
        className="mt-6 pt-6 border-t border-taysir-teal/5 flex items-center gap-2 text-taysir-light font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all"
      >
        Détails du planning <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
