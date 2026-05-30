import React, { useState } from 'react';
import { useGameStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, AlertCircle, Server, ShieldCheck } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
  const store = useGameStore();
  const [provider, setProvider] = useState(store.apiProvider);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setProvider(store.apiProvider);
    }
  }, [isOpen, store.apiProvider]);

  if (!isOpen) return null;

  const handleSave = () => {
    store.setApiConfig(provider);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
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
              <Settings size={20} className="text-[#8ab4f8]" /> Pengaturan API
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-[#3c4043] rounded-full transition-colors text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-[#4285f4]/10 border border-[#4285f4]/30 p-3 rounded-lg flex gap-3 text-sm text-[#e8eaed]">
              <AlertCircle size={18} className="text-[#8ab4f8] shrink-0 mt-0.5" />
              <p>Pilih penyedia data dari server. Kunci API tetap di environment backend dan tidak pernah disimpan di browser.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider flex items-center gap-2">
                <Server size={14} /> Penyedia Data
              </label>
              <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#202124] border border-[#3c4043] rounded-lg p-3 text-white focus:outline-none focus:border-[#8ab4f8] transition-colors appearance-none"
              >
                <option value="DEFAULT">Bawaan (Gratis, Tanpa Kunci)</option>
                <option value="ALPHAVANTAGE">Alpha Vantage</option>
                <option value="FOREXRATEAPI">ForexRateAPI</option>
              </select>
            </div>

            <AnimatePresence>
              {provider !== 'DEFAULT' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <div className="bg-[#34a853]/10 border border-[#34a853]/25 rounded-lg p-3 text-xs text-[#e8eaed] flex gap-2">
                    <ShieldCheck size={16} className="text-[#81c995] shrink-0 mt-0.5" />
                    <p>Tambahkan kunci penyedia ke file `.env` server, lalu mulai ulang proxy backend.</p>
                  </div>
                  <div className="text-[10px] text-[#5f6368] mt-1 flex gap-3">
                    {provider === 'ALPHAVANTAGE' ? (
                      <a href="https://www.alphavantage.co/" target="_blank" rel="noreferrer" className="text-[#8ab4f8] hover:underline">Ambil Kunci Alpha Vantage</a>
                    ) : (
                      <a href="https://forexrateapi.com/" target="_blank" rel="noreferrer" className="text-[#8ab4f8] hover:underline">Ambil Kunci ForexRateAPI</a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-lg font-bold transition-all shadow-md mt-4
                ${saved ? 'bg-[#34a853] text-white' : 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'}
              `}
            >
              {saved ? 'TERSIMPAN!' : 'SIMPAN PENGATURAN'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
