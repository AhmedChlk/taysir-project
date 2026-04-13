'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Wallet, Calendar, AlertCircle } from 'lucide-react';

interface DrawerProps {
  type: string;
  onClose: () => void;
}

export default function Drawer({ type, onClose }: DrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-taysir-teal/20 backdrop-blur-sm z-[100]"
      />
      
      {/* Drawer Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-[101] border-l border-taysir-teal/5 flex flex-col"
      >
        {/* Header Drawer */}
        <div className="p-8 border-b border-taysir-teal/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-taysir-teal/5 rounded-2xl text-taysir-teal">
              {type === 'payments' ? <Wallet size={20} /> : <Calendar size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-taysir-teal uppercase tracking-tighter">
                {type === 'payments' ? 'Recouvrement' : 'Planning Détaillé'}
              </h2>
              <p className="text-xs font-bold text-taysir-teal/40 uppercase tracking-widest">
                Gestion Opérationnelle
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-taysir-teal/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Drawer */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20">
            <AlertCircle size={48} className="mb-4" />
            <p className="font-black text-taysir-teal uppercase tracking-tighter">
              Chargement des données {type}...
            </p>
            <p className="text-sm font-medium mt-2">
              L&apos;interface détaillée sera injectée ici dans la phase suivante.
            </p>
          </div>
        </div>

        {/* Footer Drawer */}
        <div className="p-8 border-t border-taysir-teal/5 bg-taysir-bg/50">
          <button 
            onClick={onClose}
            className="w-full btn-primary"
          >
            Fermer le tiroir
          </button>
        </div>
      </motion.div>
    </>
  );
}
