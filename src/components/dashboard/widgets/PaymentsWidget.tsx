import { Wallet, Clock, ArrowUpRight } from 'lucide-react';
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
      <div className="flex items-center gap-3 text-taysir-teal mb-6">
        <div className="w-10 h-10 rounded-xl bg-taysir-accent/10 flex items-center justify-center text-taysir-accent group-hover:bg-taysir-accent group-hover:text-white transition-colors">
          <Wallet size={20} />
        </div>
        <span className="font-bold text-sm uppercase tracking-wider">Recouvrement</span>
      </div>
      
      <div className="relative z-10">
        <div className="text-3xl font-black text-taysir-teal tracking-tighter transition-transform group-hover:scale-105 origin-left">
          {totalAmount.toLocaleString('fr-DZ')} <span className="text-lg opacity-40 font-normal">DZD</span>
        </div>
        <p className="text-xs font-bold text-taysir-accent uppercase mt-1 tracking-tighter flex items-center gap-1">
          <Clock size={12} /> {count} impayés détectés
        </p>
      </div>
      
      <div className="mt-6 relative z-10">
        <div className="h-1.5 w-full bg-taysir-teal/5 rounded-full overflow-hidden">
          <div className="h-full bg-taysir-accent w-[65%] group-hover:w-[75%] transition-all duration-1000" />
        </div>
        <Link 
          href="?drawer=payments"
          className="mt-6 pt-6 border-t border-taysir-teal/5 flex items-center gap-2 text-taysir-light font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all"
        >
          Gérer les paiements <ArrowUpRight size={14} />
        </Link>
      </div>
      
      {/* Accent de fond discret */}
      <div className="absolute right-0 bottom-0 w-32 h-32 bg-taysir-accent/5 rounded-full blur-2xl group-hover:bg-taysir-accent/10 transition-colors" />
    </div>
  );
}
