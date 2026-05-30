import { create } from 'zustand';

export type TimeRange = 'LIVE' | '1D' | '5D' | '1M' | '1Y' | 'MAX';
export type CaruState = 'SLEEPY' | 'HAPPY' | 'SAD' | 'ANXIOUS' | 'EXCITED' | 'SCARED' | 'PUMPED' | 'VICTORIOUS' | 'DETERMINED';
export type GameScreen = 'MENU' | 'BRIEFING' | 'PLAYING' | 'COMPLETE';

export interface RunResult {
  score: number;
  distance: number;
  runCoins: number;
  checkpoints: number;
  crisisZonesSurvived: number;
  pair: string;
  timeRange: TimeRange;
}

function loadTotalCoins(): number {
  try {
    return parseInt(localStorage.getItem('fincars_total_coins') || localStorage.getItem('incartion_total_coins') || '0', 10) || 0;
  } catch { return 0; }
}

function saveTotalCoins(n: number) {
  try { localStorage.setItem('fincars_total_coins', String(n)); } catch {}
}

interface GameState {
  // Screen routing
  gameScreen: GameScreen;

  // Currency/time selection
  currencyPair: string;
  timeRange: TimeRange;

  // Live market data (from API / terrain position)
  currentPrice: number;
  priceChange: number;

  // Persistent economy & profile
  totalCoins: number;       // Lifetime coins (persisted in localStorage)
  unlockedSkins: string[];
  selectedSkin: string;
  bestScores: Record<string, number>;

  // Per-run stats (reset on each run)
  runCoins: number;         // Coins collected this run
  fuel: number;
  distance: number;
  score: number;
  checkpointsPassed: number;
  crisisZonesSurvived: number;

  // Game state
  isCrashed: boolean;
  caruState: CaruState;
  runVersion: number;
  soundEnabled: boolean;

  // Last run result (shown on COMPLETE screen)
  lastRunResult: RunResult | null;

  // Achievements
  achievements: string[];
  
  // API Configuration
  apiProvider: string;
  
  // Run Data
  // Actions
  setGameScreen: (screen: GameScreen) => void;
  setCurrencyPair: (pair: string) => void;
  setTimeRange: (range: TimeRange) => void;
  setApiConfig: (provider: string) => void;
  updateMarketData: (price: number, change: number) => void;
  updateGameStats: (stats: Partial<{ runCoins: number; fuel: number; distance: number; score: number; checkpointsPassed: number; crisisZonesSurvived: number }>) => void;
  awardCoins: (amount: number) => void;    // Awards to both run + total
  spendCoins: (amount: number) => void;    // Deducts from total only
  setCrashed: (crashed: boolean) => void;
  setCaruState: (state: CaruState) => void;
  resetRun: () => void;
  finishRun: () => void;                   // Transitions to COMPLETE screen
  toggleSound: () => void;
  addAchievement: (text: string) => void;
  unlockSkin: (skinId: string) => void;
  selectSkin: (skinId: string) => void;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('fincars_profile') || localStorage.getItem('incartion_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unlockedSkins: ['default'], selectedSkin: 'default', bestScores: {}, achievements: [] };
}

function saveProfile(profile: any) {
  try { localStorage.setItem('fincars_profile', JSON.stringify(profile)); } catch {}
}

const initialProfile = loadProfile();

try {
  localStorage.removeItem('trading_game_api_key');
} catch {}

export const useGameStore = create<GameState>((set, get) => ({
  gameScreen: 'MENU',
  currencyPair: 'USD/IDR',
  timeRange: '1D',
  currentPrice: 0,
  priceChange: 0,
  totalCoins: loadTotalCoins(),
  unlockedSkins: initialProfile.unlockedSkins,
  selectedSkin: initialProfile.selectedSkin,
  bestScores: initialProfile.bestScores,
  runCoins: 0,
  fuel: 100,
  distance: 0,
  score: 0,
  checkpointsPassed: 0,
  crisisZonesSurvived: 0,
  isCrashed: false,
  caruState: 'SLEEPY',
  runVersion: 0,
  soundEnabled: localStorage.getItem('trading_game_sound_enabled') !== 'false',
  lastRunResult: null,
  achievements: initialProfile.achievements,

  apiProvider: localStorage.getItem('trading_game_api_provider') || 'DEFAULT',

  setGameScreen: (screen) => set({ gameScreen: screen }),
  setCurrencyPair: (pair) => set({ currencyPair: pair }),
  setTimeRange: (range) => set({ timeRange: range }),
  
  setApiConfig: (provider) => {
    localStorage.setItem('trading_game_api_provider', provider);
    localStorage.removeItem('trading_game_api_key');
    set({ apiProvider: provider });
  },

  updateMarketData: (price, change) => set({ 
    currentPrice: price, 
    priceChange: change 
  }),
  updateGameStats: (stats) => set(stats),

  awardCoins: (amount) => set((state) => {
    const newTotal = state.totalCoins + amount;
    saveTotalCoins(newTotal);
    return { totalCoins: newTotal, runCoins: state.runCoins + amount };
  }),

  spendCoins: (amount) => set((state) => {
    const newTotal = Math.max(0, state.totalCoins - amount);
    saveTotalCoins(newTotal);
    return { totalCoins: newTotal };
  }),

  setCrashed: (crashed) => set({ isCrashed: crashed, caruState: crashed ? 'SCARED' : 'HAPPY' }),

  setCaruState: (caruState) => set({ caruState }),

  resetRun: () => set((state) => ({
    runCoins: 0,
    fuel: 100,
    distance: 0,
    score: 0,
    checkpointsPassed: 0,
    crisisZonesSurvived: 0,
    isCrashed: false,
    caruState: 'HAPPY',
    runVersion: state.runVersion + 1,
    gameScreen: 'PLAYING',
  })),

  finishRun: () => set((state) => {
    const result: RunResult = {
      score: state.score,
      distance: state.distance,
      runCoins: state.runCoins,
      checkpoints: state.checkpointsPassed,
      crisisZonesSurvived: state.crisisZonesSurvived,
      pair: state.currencyPair,
      timeRange: state.timeRange,
    };

    const newBestScores = { ...state.bestScores };
    const currentBest = newBestScores[state.currencyPair] || 0;
    if (state.score > currentBest) {
      newBestScores[state.currencyPair] = state.score;
    }

    saveProfile({
      unlockedSkins: state.unlockedSkins,
      selectedSkin: state.selectedSkin,
      bestScores: newBestScores,
      achievements: state.achievements
    });

    return { gameScreen: 'COMPLETE', lastRunResult: result, bestScores: newBestScores };
  }),

  toggleSound: () => set((state) => {
    const newVal = !state.soundEnabled;
    localStorage.setItem('trading_game_sound_enabled', String(newVal));
    return { soundEnabled: newVal };
  }),

  addAchievement: (text) => set((state) => {
    if (state.achievements.includes(text)) return state;
    const newAchievements = [...state.achievements, text];
    saveProfile({
      unlockedSkins: state.unlockedSkins,
      selectedSkin: state.selectedSkin,
      bestScores: state.bestScores,
      achievements: newAchievements
    });
    return { achievements: newAchievements };
  }),

  unlockSkin: (skinId) => set((state) => {
    if (state.unlockedSkins.includes(skinId)) return state;
    const newSkins = [...state.unlockedSkins, skinId];
    saveProfile({
      unlockedSkins: newSkins,
      selectedSkin: state.selectedSkin,
      bestScores: state.bestScores,
      achievements: state.achievements
    });
    return { unlockedSkins: newSkins };
  }),

  selectSkin: (skinId) => set((state) => {
    if (!state.unlockedSkins.includes(skinId)) return state;
    saveProfile({
      unlockedSkins: state.unlockedSkins,
      selectedSkin: skinId,
      bestScores: state.bestScores,
      achievements: state.achievements
    });
    return { selectedSkin: skinId };
  }),
}));
