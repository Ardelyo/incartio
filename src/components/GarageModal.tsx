import React from 'react';
import { useGameStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check } from 'lucide-react';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SKINS = [
  { id: 'default', name: 'Caru Emas', reqText: 'Skin Bawaan', icon: '🐻', cost: 0 },
  { id: 'panda', name: 'Caru Panda', reqText: '10.000 Koin', icon: '🐼', cost: 10000 },
  { id: 'fox', name: 'Caru Rubah', reqText: '50.000 Koin', icon: '🦊', cost: 50000 },
  { id: 'tiger', name: 'Caru Macan', reqText: '100.000 Koin', icon: '🐯', cost: 100000 },
  { id: 'crown', name: 'Caru Mahkota', reqText: '250.000 Koin', icon: '👑', cost: 250000 },
];

export const GarageModal: React.FC<GarageModalProps> = ({ isOpen, onClose }) => {
  const store = useGameStore();

  if (!isOpen) return null;

  const handleUnlock = (skinId: string, cost: number) => {
    if (store.totalCoins >= cost) {
      // Consume coins and unlock
      store.awardCoins(-cost);
      store.unlockSkin(skinId);
      store.selectSkin(skinId);
      store.addAchievement(`${SKINS.find(s => s.id === skinId)?.name} terbuka!`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#202124]/90 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-[#2a2b2e] border border-[#3c4043] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-4 border-b border-[#3c4043] flex justify-between items-center bg-[#202124]">
            <h2 className="text-xl font-bold font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
              🏎️ Garasi Caru
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-[#3c4043] rounded-full transition-colors text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 bg-[#202124]/50 border-b border-[#3c4043] flex justify-between items-center text-sm">
            <span className="text-gray-400">Total Koin Tersedia</span>
            <span className="font-mono font-bold text-[#fbbc04]">💰 {store.totalCoins.toLocaleString()}</span>
          </div>

          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {SKINS.map((skin) => {
              const isUnlocked = store.unlockedSkins.includes(skin.id);
              const isSelected = store.selectedSkin === skin.id;
              const canAfford = store.totalCoins >= skin.cost;

              return (
                <div
                  key={skin.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors
                    ${isSelected ? 'bg-[#4285f4]/10 border-[#4285f4]' : 'bg-[#202124] border-[#3c4043] hover:border-[#5f6368]'}
                    ${!isUnlocked && !canAfford ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#3c4043] rounded-lg flex items-center justify-center text-2xl shadow-inner">
                      {skin.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">{skin.name}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {isUnlocked ? 'Terbuka' : skin.reqText}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <div className="bg-[#4285f4] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Check size={14} /> DIPAKAI
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => store.selectSkin(skin.id)}
                        className="bg-[#3c4043] hover:bg-[#5f6368] text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        PAKAI
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlock(skin.id, skin.cost)}
                        disabled={!canAfford}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-md
                          ${canAfford ? 'bg-[#fbbc04] text-[#202124] hover:bg-[#f29900]' : 'bg-[#3c4043] text-gray-500 cursor-not-allowed'}
                        `}
                      >
                        {canAfford ? 'BUKA' : <><Lock size={12} /> {skin.cost.toLocaleString('id-ID')}</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
