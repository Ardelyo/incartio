import React from 'react';
import { useGameStore, TimeRange } from '../store';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Info, Instagram, Globe, X, ExternalLink, Hash, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const currencyNames: Record<string, string> = {
  USD: 'United States Dollar',
  IDR: 'Indonesian Rupiah',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  BTC: 'Bitcoin',
  AUD: 'Australian Dollar',
};

export const Header: React.FC = () => {
  const { currencyPair, currentPrice, priceChange, timeRange, soundEnabled, toggleSound } = useGameStore();
  
  const isUp = priceChange >= 0;
  const [base, target] = currencyPair.split('/');
  const baseName = currencyNames[base] || base;
  const targetName = currencyNames[target] || target;
  
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [showCredits, setShowCredits] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCredits(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const dateStr = currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const timeStr = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
  
  const handleShare = async () => {
    const text = 'Mainkan FINCARS - game balapan finansial buatan anak bangsa, melaju di chart market asli!';
    const url = 'https://fincars.game';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FINCARS', text, url });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert('Link disalin ke clipboard!');
    } catch {}
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 flex flex-col items-start z-50 pointer-events-none text-white font-sans bg-[#202124]/30 backdrop-blur-md border-b border-white/5">
        <div className="flex w-full justify-between items-start">
          <div className="flex items-center gap-1.5 md:gap-2 text-[#9aa0a6] text-xs md:text-sm">
            <span className="truncate max-w-[120px] md:max-w-none">{baseName}</span>
            <span>setara</span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto shrink-0 animate-fade-in">
            <button 
              onClick={() => setShowCredits(true)}
              className="w-8 h-8 rounded-full bg-[#303134] text-[#8ab4f8] flex items-center justify-center hover:bg-[#3c4043] hover:text-[#aecbfa] transition-colors cursor-pointer"
              title="Info Pembuat & Komunitas"
            >
              <Info size={16} />
            </button>
            <button 
              onClick={toggleSound}
              className="w-8 h-8 rounded-full bg-[#303134] text-[#8ab4f8] flex items-center justify-center hover:bg-[#3c4043] hover:text-[#aecbfa] transition-colors cursor-pointer"
              title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={handleShare} className="w-8 h-8 rounded-full bg-[#303134] text-white flex items-center justify-center hover:bg-[#3c4043] transition-colors cursor-pointer" title="Bagikan Game">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-baseline mt-1 font-sans flex-wrap gap-x-3 gap-y-1.5 items-center">
          <span className="text-3xl md:text-[40px] tracking-tight leading-none font-medium">
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span className="text-lg md:text-xl text-[#9aa0a6] mr-1">
            {targetName}
          </span>
          
          {/* Dynamic Google Finance Style Percentage Indicator */}
          <span className={clsx(
            "text-xs md:text-sm font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1", 
            isUp ? "bg-[#81c995]/15 text-[#81c995]" : "bg-[#f28b82]/15 text-[#f28b82]"
          )}>
            <span>{isUp ? '▲' : '▼'}</span>
            <span>
              {Math.abs(priceChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <span>
              ({(priceChange / Math.max(0.0001, currentPrice - priceChange) * 100) >= 0 ? '+' : ''}
              {(priceChange / Math.max(0.0001, currentPrice - priceChange) * 100).toFixed(2)}%)
            </span>
          </span>
        </div>
        
        <div className="flex items-center gap-1 mt-1.5 md:mt-2 text-[10px] md:text-xs text-[#9aa0a6]">
          <span>{dateStr}, {timeStr} UTC · Penyangkalan</span>
        </div>
        
        <div className="w-full mt-3 md:mt-4 flex items-center gap-1 md:gap-4 pointer-events-auto border-b border-[#3c4043] pb-2 text-sm font-medium overflow-x-auto scrollbar-hide">
          <TimeSelector />
        </div>
      </div>

      {/* Credits Dialog Modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            onClick={() => setShowCredits(false)}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#202124] border border-[#3c4043] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left overflow-hidden"
            >
              {/* Decorative subtle glow background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#8ab4f8]/10 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setShowCredits(false)}
                className="absolute top-4 right-4 text-[#9aa0a6] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#303134] cursor-pointer z-10"
                title="Tutup"
              >
                <X size={18} />
              </button>
              
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 border-b border-[#3c4043] pb-4 mb-4 relative z-10"
              >
                <div className="p-3 rounded-xl bg-[#8ab4f8]/10 text-[#8ab4f8] shadow-inner">
                  <Info size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Kreator &amp; Komunitas</h3>
                  <p className="text-xs text-[#9aa0a6] mt-0.5">Tentang Pembuat Game &amp; Rekan Komunitas</p>
                </div>
              </motion.div>
              
              {/* Message */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-[#e8eaed] mb-4 leading-relaxed relative z-10"
              >
                Game Jeep petualangan chart interaktif ini dibuat secara kreatif lewat kolaborasi:
              </motion.p>
              
              {/* Credits Grid */}
              <div className="space-y-3 relative z-10">
                {/* 1. #ockoding */}
                <motion.a 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  href="https://instagram.com/explore/tags/ockoding" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#303134]/40 hover:bg-[#303134]/80 border border-[#3c4043]/50 hover:border-[#8ab4f8]/50 hover:shadow-[0_0_15px_rgba(138,180,248,0.1)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                      <Hash size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-[#8ab4f8] transition-colors">#ockoding</h4>
                      <p className="text-xs text-[#9aa0a6] mt-0.5">Tagar Kreator</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[#5f6368] group-hover:text-[#8ab4f8] transition-colors" />
                </motion.a>

                {/* 2. #ourcreativityidn */}
                <motion.a 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  href="https://instagram.com/explore/tags/ourcreativityidn" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#303134]/40 hover:bg-[#303134]/80 border border-[#3c4043]/50 hover:border-[#8ab4f8]/50 hover:shadow-[0_0_15px_rgba(138,180,248,0.1)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                      <Hash size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-[#8ab4f8] transition-colors">#ourcreativityidn</h4>
                      <p className="text-xs text-[#9aa0a6] mt-0.5">Tagar Ruang Kreatif</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[#5f6368] group-hover:text-[#8ab4f8] transition-colors" />
                </motion.a>

                {/* 3. @ourcreativity.ofc */}
                <motion.a 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  href="https://instagram.com/ourcreativity.ofc" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#303134]/40 hover:bg-[#303134]/80 border border-[#3c4043]/50 hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.1)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
                      <Instagram size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-pink-400 transition-colors">@ourcreativity.ofc</h4>
                      <p className="text-xs text-[#9aa0a6] mt-0.5">Instagram Resmi Komunitas</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[#5f6368] group-hover:text-pink-400 transition-colors" />
                </motion.a>

                {/* 4. OurCreativity.vercel.app */}
                <motion.a 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  href="https://OurCreativity.vercel.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#303134]/40 hover:bg-[#303134]/80 border border-[#3c4043]/50 hover:border-[#34a853]/40 hover:shadow-[0_0_15px_rgba(52,168,83,0.1)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-lg bg-[#34a853]/10 text-[#34a853] group-hover:scale-110 group-hover:bg-[#34a853]/20 transition-all duration-300">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-[#34a853] transition-colors">OurCreativity.vercel.app</h4>
                      <p className="text-xs text-[#9aa0a6] mt-0.5">Web Komunitas</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[#5f6368] group-hover:text-[#34a853] transition-colors" />
                </motion.a>
              </div>
              
              {/* Footer text */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-center text-[10px] text-[#9aa0a6] font-medium uppercase tracking-wider relative z-10"
              >
                Dibuat dengan dedikasi · Mari gabung dan berkembang! ✨
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const TimeSelector: React.FC = () => {
    const { timeRange, setTimeRange } = useGameStore();
    const ranges: TimeRange[] = ['1D', '5D', '1M', '1Y', 'MAX', 'LIVE'];
    
    return (
        <>
            {ranges.map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={twMerge(
                      "px-3 py-1.5 rounded-full transition-colors whitespace-nowrap",
                      timeRange === range 
                        ? (range === 'LIVE' ? "bg-red-500/20 text-red-400" : "bg-[#8ab4f8]/20 text-[#8ab4f8]")
                        : "text-[#9aa0a6] hover:bg-[#3c4043]/50"
                  )}
                >
                    {range === 'MAX' ? 'Maks' : range}
                </button>
            ))}
        </>
    )
}
