import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, TimeRange } from '../store';
import { PAIR_PROFILES, getCrisisZones } from '../utils/marketData';
import { Volume2, VolumeX, Info, Instagram, Globe, X, Hash, ExternalLink, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { GarageModal } from './GarageModal';
import { ApiSettingsModal } from './ApiSettingsModal';

const PAIR_FLAGS: Record<string, string> = {
  'USD/IDR': '🇮🇩',
  'EUR/USD': '🇪🇺',
  'GBP/JPY': '🇬🇧',
  'USD/JPY': '🇯🇵',
  'BTC/USD': '₿',
  'AUD/USD': '🇦🇺',
};

const PAIR_DIFFICULTY: Record<string, { level: string; color: string; bars: number }> = {
  'USD/IDR': { level: 'HARD', color: 'text-[#ea4335]', bars: 4 },
  'EUR/USD': { level: 'EASY', color: 'text-[#34a853]', bars: 1 },
  'GBP/JPY': { level: 'EXTREME', color: 'text-[#f29900]', bars: 5 },
  'USD/JPY': { level: 'MEDIUM', color: 'text-[#fbbc04]', bars: 3 },
  'BTC/USD': { level: 'EXTREME', color: 'text-[#f29900]', bars: 5 },
  'AUD/USD': { level: 'MEDIUM', color: 'text-[#fbbc04]', bars: 2 },
};

const TIME_LABELS: Record<TimeRange, string> = {
  '1D': '1 Day',
  '5D': '5 Days',
  '1M': '1 Month',
  '1Y': '1 Year',
  'MAX': 'MAX History',
  'LIVE': 'LIVE',
};

interface CurrencyNames {
  [key: string]: string;
}
const CURRENCY_NAMES: CurrencyNames = {
  USD: 'US Dollar',
  IDR: 'Indonesian Rupiah',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  BTC: 'Bitcoin',
  AUD: 'Australian Dollar',
};

// Animated canvas background (mini chart preview)
const AnimatedBg: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let t = 0;
    const pts: number[] = Array.from({ length: 80 }, (_, i) =>
      0.5 + 0.3 * Math.sin(i * 0.18) + 0.15 * Math.sin(i * 0.07) + 0.08 * Math.cos(i * 0.44)
    );
    const draw = () => {
      t += 0.008;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(129,201,149,0.08)');
      grad.addColorStop(0.5, 'rgba(138,180,248,0.06)');
      grad.addColorStop(1, 'rgba(242,139,130,0.08)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      pts.forEach((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h * 0.2 + (0.6 * h) * (1 - (p + 0.12 * Math.sin(i * 0.2 + t)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h * 0.2 + (0.6 * h) * (1 - (p + 0.12 * Math.sin(i * 0.2 + t)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(129,201,149,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export const MainMenu: React.FC = () => {
  const store = useGameStore();
  const [selectedPair, setSelectedPair] = useState(store.currencyPair);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(store.timeRange);
  const [showCredits, setShowCredits] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  const pairs = Object.values(PAIR_PROFILES);
  const crisisZones = getCrisisZones(selectedPair);
  const diff = PAIR_DIFFICULTY[selectedPair] || PAIR_DIFFICULTY['USD/IDR'];
  const [base, target] = selectedPair.split('/');

  const handlePlay = () => {
    store.setCurrencyPair(selectedPair);
    store.setTimeRange(selectedRange);
    store.setGameScreen('BRIEFING');
  };

  const ranges: TimeRange[] = ['1D', '5D', '1M', '1Y', 'MAX', 'LIVE'];

  return (
    <div className="fixed inset-0 bg-[#202124] text-white overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Animated bg */}
      <AnimatedBg />

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }}
      />

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={() => setShowApiSettings(true)}
          className="w-9 h-9 rounded-full bg-[#303134] text-[#8ab4f8] flex items-center justify-center hover:bg-[#3c4043] transition-colors"
          title="API Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => setShowGarage(true)}
          className="w-9 h-9 rounded-full bg-[#303134] text-[#8ab4f8] flex items-center justify-center hover:bg-[#3c4043] transition-colors"
          title="Garage & Skins"
        >
          <User size={16} />
        </button>
        <button
          onClick={() => store.toggleSound()}
          className="w-9 h-9 rounded-full bg-[#303134] text-[#8ab4f8] flex items-center justify-center hover:bg-[#3c4043] transition-colors"
          title={store.soundEnabled ? 'Mute' : 'Unmute'}
        >
          {store.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          onClick={() => setShowCredits(true)}
          className="w-9 h-9 rounded-full bg-[#303134] text-[#8ab4f8] flex items-center justify-center hover:bg-[#3c4043] transition-colors"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Total coins badge */}
      {store.totalCoins > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 flex items-center gap-2 bg-[#303134] border border-[#3c4043] rounded-full px-3 py-1.5 text-xs font-mono"
        >
          <span className="text-[#fbbc04]">🪙</span>
          <span className="text-[#e8eaed] font-semibold">{store.totalCoins.toLocaleString()}</span>
          <span className="text-[#9aa0a6]">total coins</span>
        </motion.div>
      )}

      <div className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col gap-6">
        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="flex justify-center mb-3">
            {/* Caru mascot emoji placeholder */}
            <div className="text-6xl drop-shadow-lg select-none">🦊</div>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none">
            <span className="text-white">INCAR</span><span className="text-[#8ab4f8]">TION</span>
          </h1>
          <p className="text-[#9aa0a6] text-sm mt-2 tracking-wide">Drive through market history. Learn as you go.</p>
        </motion.div>

        {/* Track Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#292a2d] rounded-2xl border border-[#3c4043] overflow-hidden"
        >
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-[#5f6368] font-semibold mb-2">Select Track</p>
            <div className="flex flex-wrap gap-2">
              {pairs.map(p => (
                <button
                  key={p.pair}
                  onClick={() => setSelectedPair(p.pair)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150',
                    selectedPair === p.pair
                      ? 'bg-[#8ab4f8] text-[#202124] border-transparent'
                      : 'bg-transparent text-[#9aa0a6] border-[#3c4043] hover:border-[#8ab4f8]/50 hover:text-[#e8eaed]'
                  )}
                >
                  <span>{PAIR_FLAGS[p.pair] || '🏁'}</span>
                  <span>{p.pair}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected pair detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPair}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="px-4 pb-4 pt-3 border-t border-[#3c4043] mt-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-[#e8eaed]">{CURRENCY_NAMES[base]} / {CURRENCY_NAMES[target]}</h3>
                  <p className="text-[10px] text-[#9aa0a6] mt-0.5">{PAIR_PROFILES[selectedPair]?.theme || ''}</p>
                </div>
                <div className={clsx('text-right text-xs font-bold', diff.color)}>
                  <div>{diff.level}</div>
                  <div className="flex gap-0.5 mt-1 justify-end">
                    {[1,2,3,4,5].map(b => (
                      <div key={b} className={clsx('w-2.5 h-1.5 rounded-sm', b <= diff.bars ? 'bg-current' : 'bg-[#3c4043]')} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Crisis zones */}
              {crisisZones.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[9px] uppercase tracking-widest text-[#5f6368] font-semibold">Historical Crisis Zones</p>
                  {crisisZones.map((z, i) => (
                    <div key={i} className={clsx(
                      'flex items-center gap-2 text-[10px] rounded-lg px-2.5 py-1.5',
                      z.severity === 'EXTREME' ? 'bg-[#ea4335]/10 text-[#f28b82]' :
                      z.severity === 'SEVERE' ? 'bg-[#f29900]/10 text-[#fbbc04]' :
                      'bg-[#34a853]/10 text-[#81c995]'
                    )}>
                      <span className="font-semibold">{z.label}</span>
                      <span className="text-[#5f6368]">({z.year})</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Time range */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#292a2d] rounded-2xl border border-[#3c4043] p-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-[#5f6368] font-semibold mb-2.5">Time Range</p>
          <div className="flex flex-wrap gap-2">
            {ranges.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  selectedRange === r
                    ? r === 'LIVE'
                      ? 'bg-[#ea4335]/20 text-[#ea4335] border-[#ea4335]/40'
                      : 'bg-[#8ab4f8]/20 text-[#8ab4f8] border-[#8ab4f8]/40'
                    : 'bg-transparent text-[#9aa0a6] border-[#3c4043] hover:text-[#e8eaed]'
                )}
              >
                {r === 'LIVE' ? '🔴 LIVE' : TIME_LABELS[r]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Play button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePlay}
          className="w-full py-4 rounded-2xl bg-[#8ab4f8] text-[#202124] font-black text-lg tracking-tight shadow-lg hover:bg-[#aecbfa] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <span>🏎️ START RACE</span>
        </motion.button>

        {/* Controls hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex justify-center gap-6 text-[10px] text-[#5f6368] font-mono"
        >
          <span>◀ ▶ or A D — Drive</span>
          <span>▲ W Space — Jump</span>
        </motion.div>
      </div>

      {/* Credits modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCredits(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#202124] border border-[#3c4043] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#8ab4f8]/10 to-transparent" />
              <button
                onClick={() => setShowCredits(false)}
                className="absolute top-4 right-4 text-[#9aa0a6] hover:text-white p-1.5 rounded-full hover:bg-[#303134] z-10"
              >
                <X size={18} />
              </button>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#3c4043]">
                  <div className="text-3xl">🦊</div>
                  <div>
                    <h3 className="font-bold text-white">Kreator & Komunitas</h3>
                    <p className="text-xs text-[#9aa0a6]">Tentang game & komunitas</p>
                  </div>
                </div>
                <p className="text-sm text-[#e8eaed] mb-4 leading-relaxed">
                  Game Jeep petualangan chart interaktif ini dibuat secara kreatif lewat kolaborasi:
                </p>
                <div className="space-y-3">
                  {[
                    { icon: <Hash size={16} />, label: '#ockoding', sub: 'Creator Hashtag', href: 'https://instagram.com/explore/tags/ockoding', color: 'indigo' },
                    { icon: <Hash size={16} />, label: '#ourcreativityidn', sub: 'Creative Space', href: 'https://instagram.com/explore/tags/ourcreativityidn', color: 'teal' },
                    { icon: <Instagram size={16} />, label: '@ourcreativity.ofc', sub: 'Official Instagram', href: 'https://instagram.com/ourcreativity.ofc', color: 'pink' },
                    { icon: <Globe size={16} />, label: 'OurCreativity.vercel.app', sub: 'Web Komunitas', href: 'https://OurCreativity.vercel.app', color: 'green' },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-[#303134]/40 hover:bg-[#303134] border border-[#3c4043]/50 hover:border-[#8ab4f8]/40 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#8ab4f8]/10 text-[#8ab4f8]">{item.icon}</div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-[#8ab4f8] transition-colors">{item.label}</div>
                          <div className="text-[10px] text-[#9aa0a6]">{item.sub}</div>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-[#5f6368] group-hover:text-[#8ab4f8]" />
                    </a>
                  ))}
                </div>
                <p className="text-center text-[10px] text-[#5f6368] mt-5 uppercase tracking-wider">Dibuat dengan dedikasi ✨</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GarageModal isOpen={showGarage} onClose={() => setShowGarage(false)} />
      <ApiSettingsModal isOpen={showApiSettings} onClose={() => setShowApiSettings(false)} />
    </div>
  );
};
