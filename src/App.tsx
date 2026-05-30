import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { GameCanvas } from './components/GameCanvas';
import { Header } from './components/Header';
import { HUD } from './components/HUD';
import { TermsModal } from './components/TermsModal';
import { MainMenu } from './components/MainMenu';
import { RunComplete } from './components/RunComplete';
import { PreRunBriefing } from './components/PreRunBriefing';
import { AchievementToaster } from './components/AchievementToaster';
import { SplashScreen } from './components/SplashScreen';
import { BrandingFooter } from './components/BrandingFooter';
import { useGameStore } from './store';

export default function App() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const gameScreen = useGameStore(s => s.gameScreen);

  // Prevent context menu on long press
  useEffect(() => {
    const handleContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Check if terms have already been agreed to
  useEffect(() => {
    const hasAgreed = localStorage.getItem('trading_game_terms_agreed');
    if (hasAgreed !== 'true') {
      setIsTermsOpen(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('trading_game_terms_agreed', 'true');
    setIsTermsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-[#202124] text-white overflow-hidden font-sans">
      <SplashScreen onComplete={() => setSplashComplete(true)} />
      
      <AchievementToaster />
      
      {(gameScreen === 'PLAYING' || gameScreen === 'COMPLETE') && <Header />}
      
      {gameScreen === 'MENU' && <MainMenu />}

      {gameScreen === 'BRIEFING' && <PreRunBriefing />}
      
      {gameScreen === 'PLAYING' && (
        <>
          <HUD />
          <GameCanvas />
        </>
      )}

      {gameScreen === 'COMPLETE' && <RunComplete />}
      
      <TermsModal isOpen={isTermsOpen} onClose={handleAcceptTerms} />
      
      <BrandingFooter />
      
      <Analytics />
    </div>
  );
}
