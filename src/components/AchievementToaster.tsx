import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';

export const AchievementToaster: React.FC = () => {
  const achievements = useGameStore(s => s.achievements);
  const [queue, setQueue] = useState<{ id: string; text: string }[]>([]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (achievements.length > 0) {
      const latest = achievements[achievements.length - 1];
      const id = Math.random().toString(36).substring(2, 11);
      setQueue(prev => [...prev, { id, text: latest }]);

      // Remove after 4 seconds
      setTimeout(() => {
        setQueue(prev => prev.filter(a => a.id !== id));
      }, 4000);
    }
  }, [achievements]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {queue.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
            className="bg-gradient-to-r from-[#fbbc04]/20 to-[#f29900]/20 border border-[#fbbc04]/50 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-3 shadow-[0_0_20px_rgba(251,188,4,0.3)]"
          >
            <div className="bg-[#fbbc04] text-[#202124] p-1.5 rounded-full">
              <Trophy size={14} className="fill-current" />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#fbbc04] mb-0.5">Achievement Unlocked</div>
              <div className="text-sm font-bold text-white leading-none">{item.text}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
