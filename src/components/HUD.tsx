import React, { useState, useCallback } from 'react';
import { useGameStore } from '../store';
import { clsx } from 'clsx';
import { TermsModal } from './TermsModal';

export const HUD: React.FC = () => {
  const { fuel, runCoins, distance, score, resetRun } = useGameStore();
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const fuelColor = fuel > 50 ? 'bg-[#81c995]' : fuel > 20 ? 'bg-[#fbbc04]' : 'bg-[#ea4335] animate-pulse';

  // Touch button handlers — emit custom events to GameCanvas
  const makeTouchHandlers = useCallback((side: 'left' | 'right' | 'jump') => {
    const emit = (active: boolean) => window.dispatchEvent(new CustomEvent('game-control', { detail: { control: side, active } }));
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        emit(true);
      },
      onPointerUp: (e: React.PointerEvent) => emit(false),
      onPointerLeave: (e: React.PointerEvent) => emit(false),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
  }, []);

  return (
    <>
      {/* ── Top-left stats bar ── */}
      <div className="absolute top-[138px] md:top-[132px] left-3 z-50 pointer-events-none flex flex-col items-start gap-2 origin-top-left scale-90 md:scale-100">

        {/* Fuel bar */}
        <div className="w-44 bg-[#292a2d] p-1.5 rounded-full border border-[#3c4043] flex items-center gap-2 shadow-md">
          <span className="text-xs font-bold text-white px-1">⛽</span>
          <div className="flex-1 h-2.5 bg-[#202124] rounded-full overflow-hidden">
            <div
              className={clsx('h-full transition-all duration-300', fuelColor)}
              style={{ width: `${Math.min(100, Math.max(0, fuel))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[#9aa0a6] w-8 text-right pr-1">{Math.floor(fuel)}%</span>
        </div>

        {/* Score + coins + distance */}
        <div className="flex items-center gap-3 bg-[#292a2d] px-3 py-1.5 rounded-full border border-[#3c4043] shadow-md pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="text-[#8ab4f8] text-xs">🏆</span>
            <span className="font-mono text-[#e8eaed] font-bold text-xs">{score.toLocaleString()}</span>
          </div>
          <div className="w-px h-3.5 bg-[#3c4043]" />
          <div className="flex items-center gap-1">
            <span className="text-[#fbbc04] text-xs">🪙</span>
            <span className="font-mono text-[#e8eaed] font-medium text-xs">{runCoins}</span>
          </div>
          <div className="w-px h-3.5 bg-[#3c4043]" />
          <div className="flex items-center gap-1">
            <span className="text-[#8ab4f8] text-xs">📏</span>
            <span className="font-mono text-[#e8eaed] font-medium text-xs">{distance}m</span>
          </div>
          <div className="w-px h-3.5 bg-[#3c4043]" />
          <button
            onClick={resetRun}
            className="text-[10px] font-medium text-[#8ab4f8] hover:text-[#aecbfa] transition-colors"
          >
            ↺
          </button>
          <button
            onClick={() => setIsTermsOpen(true)}
            className="text-[9px] w-4 h-4 rounded-full border border-[#5f6368] text-[#9aa0a6] hover:text-white flex items-center justify-center"
          >
            i
          </button>
        </div>
      </div>

      {/* ── Mobile touch controls (bottom) ── */}
      <div className="absolute bottom-24 left-0 right-0 z-40 flex justify-between items-end px-4 pointer-events-none md:hidden">
        {/* Left: Brake */}
        <button
          {...makeTouchHandlers('left')}
          className="pointer-events-auto w-20 h-16 rounded-2xl bg-[#292a2d]/80 border-2 border-[#3c4043] backdrop-blur-sm flex flex-col items-center justify-center gap-1 active:bg-[#3c4043] active:border-[#8ab4f8] select-none touch-none"
        >
          <span className="text-xl">◀</span>
          <span className="text-[9px] text-[#9aa0a6] font-mono uppercase">Brake</span>
        </button>

        {/* Center: Jump */}
        <button
          {...makeTouchHandlers('jump')}
          className="pointer-events-auto w-16 h-16 rounded-full bg-[#8ab4f8]/20 border-2 border-[#8ab4f8]/40 backdrop-blur-sm flex flex-col items-center justify-center gap-1 active:bg-[#8ab4f8]/40 select-none touch-none"
        >
          <span className="text-xl">▲</span>
          <span className="text-[8px] text-[#8ab4f8] font-mono uppercase">Jump</span>
        </button>

        {/* Right: Gas */}
        <button
          {...makeTouchHandlers('right')}
          className="pointer-events-auto w-20 h-16 rounded-2xl bg-[#81c995]/10 border-2 border-[#81c995]/30 backdrop-blur-sm flex flex-col items-center justify-center gap-1 active:bg-[#81c995]/25 active:border-[#81c995] select-none touch-none"
        >
          <span className="text-xl">▶</span>
          <span className="text-[9px] text-[#81c995] font-mono uppercase">Gas</span>
        </button>
      </div>

      {/* Desktop controls hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 hidden md:flex items-center gap-4 text-[9px] text-[#3c4043] font-mono select-none pointer-events-none">
        <span>◀ A — Brake</span>
        <span>▶ D — Gas</span>
        <span>▲ W Space — Jump</span>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
};
