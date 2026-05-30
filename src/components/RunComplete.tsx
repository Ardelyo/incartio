import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../store';
import { playCheckpointSFX, playVroomSFX } from '../utils/audio';

const PAIR_FLAGS: Record<string, string> = {
  'USD/IDR': '🇮🇩', 'EUR/USD': '🇪🇺', 'GBP/JPY': '🇬🇧',
  'USD/JPY': '🇯🇵', 'BTC/USD': '₿', 'AUD/USD': '🇦🇺',
};

// Confetti particle canvas
const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const COLORS = ['#4285f4','#34a853','#fbbc05','#ea4335','#a142f4','#24c1e0','#81c995','#8ab4f8'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      size: 5 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.05;
        if (p.y > canvas.height + 30) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.vy = 2 + Math.random() * 3;
        }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

// Generate share text
function buildShareText(result: NonNullable<ReturnType<typeof useGameStore>['lastRunResult']>): string {
  const flag = PAIR_FLAGS[result.pair] || '🏁';
  return `🏎️ I drove ${flag} ${result.pair} for ${result.distance.toLocaleString()}m in Incartion!\n`
    + `🏆 Score: ${result.score.toLocaleString()} | 🪙 Coins: ${result.runCoins}\n`
    + `🏁 Checkpoints: ${result.checkpoints} | ⚡ Crisis zones survived: ${result.crisisZonesSurvived}\n`
    + `Try to beat me → https://incartion.game #Incartion #LiterasiKeuangan`;
}

// Draw share card on canvas and trigger download
async function downloadShareCard(result: NonNullable<ReturnType<typeof useGameStore>['lastRunResult']>) {
  const W = 600, H = 320;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1b1e');
  bg.addColorStop(1, '#202124');
  ctx.fillStyle = bg;
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Green accent bar top
  ctx.fillStyle = '#81c995';
  ctx.fillRect(0, 0, W, 4);

  // Flag + pair
  const flag = PAIR_FLAGS[result.pair] || '🏁';
  ctx.font = '900 38px "Google Sans", sans-serif';
  ctx.fillStyle = '#e8eaed';
  ctx.textAlign = 'left';
  ctx.fillText(`${flag} ${result.pair}`, 32, 64);

  // Subtitle
  ctx.font = '400 15px "Google Sans", sans-serif';
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('Incartion — Drive Through Market History', 32, 88);

  // Stats grid
  const stats = [
    { label: '📏 Distance', value: `${result.distance.toLocaleString()}m` },
    { label: '🏆 Score', value: result.score.toLocaleString() },
    { label: '🪙 Coins', value: result.runCoins.toLocaleString() },
    { label: '🏁 Checkpoints', value: String(result.checkpoints) },
  ];
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 32 + col * 280;
    const y = 128 + row * 72;
    ctx.fillStyle = '#292a2d';
    ctx.beginPath();
    (ctx as any).roundRect(x, y, 250, 55, 12);
    ctx.fill();
    ctx.font = '400 11px "Google Sans", sans-serif';
    ctx.fillStyle = '#9aa0a6';
    ctx.fillText(s.label, x + 14, y + 20);
    ctx.font = '700 22px "Google Sans", sans-serif';
    ctx.fillStyle = '#e8eaed';
    ctx.fillText(s.value, x + 14, y + 44);
  });

  // Bottom CTA
  ctx.font = '500 13px "Google Sans", sans-serif';
  ctx.fillStyle = '#8ab4f8';
  ctx.textAlign = 'center';
  ctx.fillText('Beat me at incartion.game  ·  #Incartion', W / 2, H - 20);

  // Download
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `incartion-${result.pair.replace('/', '-')}.png`;
  a.click();
}

async function nativeShare(result: NonNullable<ReturnType<typeof useGameStore>['lastRunResult']>) {
  const text = buildShareText(result);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Incartion Run Result', text });
      return;
    } catch {}
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    alert('Share text copied to clipboard! Paste it anywhere to share.');
  } catch {
    // last resort
    downloadShareCard(result);
  }
}

export const RunComplete: React.FC = () => {
  const store = useGameStore();
  const result = store.lastRunResult;

  useEffect(() => {
    playCheckpointSFX();
  }, []);

  if (!result) return null;

  const flag = PAIR_FLAGS[result.pair] || '🏁';

  const StatCard: React.FC<{ label: string; value: string | number; icon: string; color?: string; delay?: number }> =
    ({ label, value, icon, color = '#e8eaed', delay = 0 }) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, type: 'spring', bounce: 0.3 }}
        className="bg-[#292a2d] border border-[#3c4043] rounded-xl p-4 flex flex-col gap-1"
      >
        <div className="text-lg leading-none">{icon}</div>
        <div className="text-xl font-black" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="text-[10px] text-[#9aa0a6] uppercase tracking-wider font-medium">{label}</div>
      </motion.div>
    );

  return (
    <div className="fixed inset-0 bg-[#202124]/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans">
      <ConfettiCanvas />
      <div className="relative z-10 w-full max-w-sm">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
          className="bg-[#292a2d] border border-[#3c4043] rounded-2xl p-6 mb-4 text-center overflow-hidden relative"
        >
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285f4] via-[#81c995] to-[#fbbc04]" />

          <div className="text-5xl mb-2">🏁</div>
          <h2 className="text-2xl font-black text-white tracking-tight">Run Complete!</h2>
          <p className="text-[#9aa0a6] text-sm mt-1">
            {flag} {result.pair} · {result.timeRange === 'MAX' ? 'MAX History' : result.timeRange}
          </p>

          {/* Score big display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
            className="mt-4 bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 rounded-xl py-3 px-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#8ab4f8] font-semibold mb-0.5">Final Score</p>
            <p className="text-4xl font-black text-[#8ab4f8]">{result.score.toLocaleString()}</p>
          </motion.div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard icon="📏" label="Distance" value={`${result.distance.toLocaleString()}m`} delay={0.1} />
          <StatCard icon="🪙" label="Coins Earned" value={result.runCoins} color="#fbbc04" delay={0.15} />
          <StatCard icon="🏁" label="Checkpoints" value={result.checkpoints} color="#81c995" delay={0.2} />
          <StatCard icon="⚡" label="Crisis Zones" value={`${result.crisisZonesSurvived} survived`} color="#f29900" delay={0.25} />
        </div>

        {/* Total coins update */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#292a2d] border border-[#fbbc04]/20 rounded-xl p-3 mb-4 flex items-center justify-between"
        >
          <span className="text-xs text-[#9aa0a6]">Total lifetime coins</span>
          <span className="text-sm font-bold text-[#fbbc04]">🪙 {store.totalCoins.toLocaleString()}</span>
        </motion.div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => nativeShare(result)}
            className="w-full py-3.5 rounded-xl bg-[#8ab4f8] text-[#202124] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#aecbfa] transition-colors"
          >
            📱 Share My Result
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => downloadShareCard(result)}
            className="w-full py-3 rounded-xl bg-[#303134] text-[#e8eaed] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#3c4043] transition-colors border border-[#3c4043]"
          >
            🖼️ Download Share Card
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { playVroomSFX(); store.resetRun(); }}
              className="flex-1 py-3 rounded-xl bg-[#303134] text-[#8ab4f8] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#3c4043] transition-colors border border-[#3c4043]"
            >
              ↺ Play Again
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => store.setGameScreen('MENU')}
              className="flex-1 py-3 rounded-xl bg-[#303134] text-[#9aa0a6] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#3c4043] transition-colors border border-[#3c4043]"
            >
              🏠 Menu
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
