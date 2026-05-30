import React from 'react';
import { useGameStore } from '../store';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export const PreRunBriefing: React.FC = () => {
  const { currencyPair, timeRange, resetRun } = useGameStore();
  const [base, target] = currencyPair.split('/');

  // Briefing metadata
  const getBriefingData = () => {
    if (currencyPair === 'USD/IDR') return {
      title: 'Krisis Moneter Asia',
      desc: 'Bersiaplah menghadapi fluktuasi tajam Rupiah. Pantau zona 1997-1998 untuk volatilitas ekstrem.',
      difficulty: 'SULIT',
      color: '#ea4335'
    };
    if (currencyPair === 'BTC/USD') return {
      title: 'Rollercoaster Kripto',
      desc: 'Medan paling curam dan berbahaya. Hati-hati dengan jurang crypto winter.',
      difficulty: 'EKSTREM',
      color: '#fbbc04'
    };
    return {
      title: 'Pasar Reguler',
      desc: 'Perjalanan standar melintasi sejarah pergerakan harga.',
      difficulty: 'SEDANG',
      color: '#81c995'
    };
  };

  const data = getBriefingData();

  return (
    <div className="fixed inset-0 z-[60] bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-t from-[#202124] to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full bg-[#202124] border border-[#3c4043] rounded-3xl p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: data.color }} />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-sm font-bold text-[#9aa0a6] tracking-widest uppercase mb-1">Briefing Misi</h2>
            <h1 className="text-3xl font-bold text-white tracking-tight">{currencyPair}</h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#9aa0a6] uppercase font-bold mb-1">Rentang Waktu</div>
            <div className="px-3 py-1 rounded-full bg-[#3c4043] text-white font-bold text-sm">{timeRange}</div>
          </div>
        </div>

        <div className="bg-[#303134] rounded-2xl p-5 mb-8 border border-[#3c4043]">
          <h3 className="text-lg font-bold text-white mb-2" style={{ color: data.color }}>{data.title}</h3>
          <p className="text-[#9aa0a6] text-sm leading-relaxed">{data.desc}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Kesulitan:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
              {data.difficulty}
            </span>
          </div>
        </div>

        <button
          onClick={resetRun}
          className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: data.color, color: '#0F0F0F' }}
        >
          <Play size={20} fill="currentColor" />
          Mulai Ekspedisi
        </button>
      </motion.div>
    </div>
  );
};
