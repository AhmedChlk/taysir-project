import { Wallet, Clock, ArrowUpRight, TrendingDown } from 'lucide-react';
import { getPendingPaymentsAction } from '@/actions/dashboard.actions';
import Link from 'next/link';

export default async function PaymentsWidget() {
  const response = await getPendingPaymentsAction({});
  
  if (!response.success) {
    return <div className="bento-card p-8 text-red-500">Erreur chargement paiements.</div>;
  }

  const { totalAmount, count } = response.data;

  return (
    <div className="col-span-1 md:col-span-4 bg-white border border-taysir-teal/10 rounded-[32px] p-8 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-taysir-teal">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-sm">
              <TrendingDown size={24} />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-tighter block leading-none">Recouvrement</span>
              <span className="text-[10px] font-bold text-taysir-teal/40 uppercase tracking-widest mt-1 block">Recettes à recouvrer</span>
            </div>
          </div>
          <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {count} dossiers
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="text-4xl font-black text-taysir-teal tracking-tighter transition-transform group-hover:scale-105 origin-left flex items-baseline gap-2">
            {totalAmount.toLocaleString('fr-DZ')} <span className="text-xl opacity-20 font-black tracking-normal">DZD</span>
          </div>
          <p className="text-[11px] font-bold text-rose-500 uppercase mt-2 tracking-tight flex items-center gap-1.5 bg-rose-50 w-fit px-3 py-1 rounded-lg">
            <Clock size={12} strokeWidth={2.5} /> Total des impayés à ce jour
          </p>
        </div>
      </div>
      
      <div className="mt-10 space-y-4 relative z-10">
        <div className="h-2 w-full bg-taysir-teal/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
            style={{ width: '75%' }} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link 
            href="?drawer=payments"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-taysir-bg border border-taysir-teal/5 text-taysir-teal font-black text-[10px] uppercase tracking-widest hover:bg-white hover:border-taysir-teal/20 transition-all shadow-sm"
          >
            <span>Détail impayés</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link 
            href="?drawer=new-finance"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-taysir-teal text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Wallet size={14} />
            <span>Gérer Finance</span>
          </Link>
        </div>
      </div>
      
      {/* Accent de fond discret */}
      <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50 group-hover:bg-rose-100 transition-colors" />
    </div>
  );
}
