import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store';
import { PAIR_PROFILES, generateTerrainData, generateNextTick, DataPoint, fetchHistoricalDataPoints, generateMaxHistoricalData, getCrisisZones, CrisisZone } from '../utils/marketData';
import { playCoinSFX, playFuelSFX, playCrashSFX, playJumpSFX, playCheckpointSFX, playVroomSFX } from '../utils/audio';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PHYSICS_FPS = 60;
const POINT_SPACING = 30; // Closer together = much steeper hills!

interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'COIN' | 'FUEL';
  collected: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: 'BARRICADE' | 'ROCK';
  width: number;
  height: number;
  hit: boolean;
}

interface CheckpointPint {
  id: number;
  x: number;
  y: number;
  passed: boolean;
  name: string;
}

interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  type: 'smoke' | 'spark' | 'emoji' | 'text' | 'confetti';
  text?: string;
  gravity?: number;
  angle?: number;
  spinSpeed?: number;
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  // Check if it has CJK characters
  const isCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
  if (isCJK) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const store = useGameStore();
  const [dataLoading, setDataLoading] = useState(true);
  
  // Game state refs (to avoid deps in animation loop)
  const carRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    fuel: 100,
    score: 0,
    distanceX: 0, // tracking distance driven
    isGrounded: false,
    speed: 0
  });

  const controlsRef = useRef({ left: false, right: false, up: false });
  const pointsRef = useRef<{x: number, y: number}[]>([]);
  const rawDataRef = useRef<DataPoint[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, initialized: false });
  const lastTimeRef = useRef(performance.now());
  const tickTimerRef = useRef(0);
  const maxMinRef = useRef({ maxIdx: 0, minIdx: 0, maxPrice: 0, minPrice: 0 });
  const globalPriceRangeRef = useRef({ min: 0, max: 1, range: 1 }); // precomputed, updated on load
  const lastStoreSyncRef = useRef(0); // for timer-based store sync (not random)
  const crisisZonesRef = useRef<CrisisZone[]>([]);
  const activeCrisisRef = useRef<CrisisZone | null>(null); // currently inside a crisis zone
  const crisisAlertTimerRef = useRef(0); // how long to show crisis banner

  // Dynamic Dialogues & Financial Tips based on selected Currency Pair
  const idrTips = [
    "💼 Diversifikasi investasi adalah kunci utama kestabilan keuangan!",
    "📈 Inflasi itu bagai karat uang, lawan dengan investasi reksa dana atau emas!",
    "⚡ Bensin di game ini bagai likuiditas cashflow. Jangan biarkan kering!",
    "🏦 Suku bunga naik? Bagus buat instrumen deposito, batasi utang konsumtif!",
    "🔥 Lindungi nilai aset Rupiahmu dari gempuran inflasi jangka panjang!",
    "💡 Sediakan dana darurat min. 3-6 bulan pengeluaran sebagai penyelamat!",
    "🛒 Hemat pangkal kaya! Bedakan antara keinginan sekunder vs kebutuhan primer.",
    "🚀 Jangan menaruh semua telur finansialmu dalam satu keranjang investasi!",
    "📊 Jalankan rumus budget 50% kebutuhan, 30% keinginan, 20% tabung/investasi!",
    "🧠 Edukasi finansial adalah investasi terbaik dengan imbal balik termanis!",
    "🌾 Investasi sejak dini memanfaatkan keajaiban efek pertumbuhan eksponensial!",
    "☕ Waspada inflasi gaya hidup! Pendapatan naik bukan alasan konsumsi ugal-ugalan.",
    "📉 Utang konsumtif itu jebakan! Gunakan utang hanya untuk aset produktif yang menghasilkan arus kas.",
    "⛄ Mulai investasi sedini mungkin agar efek bola salju (compounding interest) bekerja maksimal!",
    "🏢 Surat Berharga Negara (SBN) menawarkan passive income aman yang dijamin undang-undang!"
  ];

  const jpyTips = [
    "?? Saat Yen melemah, pelaku pasar sering mencari aset lindung nilai lintas negara.",
    "?? Carry trade bisa menguatkan tren, tapi pembalikannya sering sangat cepat.",
    "?? Kebijakan bank sentral Jepang dapat mengguncang pasangan JPY dalam hitungan jam.",
    "?? Jangan cuma lihat arah harga; pahami juga alasan makro di balik gerakannya.",
    "??? Gunakan ukuran posisi yang masuk akal saat pair JPY sedang sangat volatil.",
  ];
  const enTips = [
    "?? Inflasi menggerus daya beli. Lawan dengan aset produktif dan rencana jangka panjang.",
    "? Bensin seperti arus kas: selalu sisakan cadangan saat pasar bergelombang.",
    "?? Harga turun bukan selalu musibah; strategi bertahap bisa menurunkan harga rata-rata.",
    "?? Suku bunga tinggi membuat instrumen pendapatan tetap lebih menarik untuk dipantau.",
    "?? Diversifikasi membantu menyebar risiko. Jangan taruh semua dana di satu aset.",
    "?? Efek majemuk bekerja paling kuat ketika kamu mulai lebih awal dan konsisten.",
    "?? Potong langganan yang tidak perlu. Kebocoran kecil bisa jadi beban besar.",
    "?? Pakai kerangka 50/30/20 agar belanja, hiburan, dan investasi tetap seimbang.",
    "?? Literasi finansial adalah investasi diri yang hasilnya ikut kamu bawa ke mana-mana.",
    "?? Utamakan aset yang menghasilkan, bukan liabilitas yang menguras kantong.",
    "?? Hindari utang berbunga tinggi; bunganya bisa mengejar lebih cepat dari mobilmu.",
    "?? Saat volatil, perlindungan bisa datang dari aset global dan kas yang cukup."
  ];

  const dialogueTipRef = useRef({
    text: "",
    timer: 1000,       // current status timer
    phase: "FADE_IN",  // FADE_IN, SHOW, FADE_OUT, SILENCE
    index: 0,
    opacity: 0,
    springY: 0,
    selectedList: enTips
  });

  const [activeAlert, setActiveAlert] = useState<{ text: string, type: 'BAD' | 'GOOD', id: number } | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pintsRef = useRef<CheckpointPint[]>([]);

  const particlesRef = useRef<GameParticle[]>([]);

  const spawnParticles = (options: {
    x: number;
    y: number;
    count?: number;
    type: 'smoke' | 'spark' | 'emoji' | 'text' | 'confetti';
    color?: string | string[];
    text?: string;
    speedMin?: number;
    speedMax?: number;
    sizeMin?: number;
    sizeMax?: number;
    gravity?: number;
  }) => {
    const { x, y, count = 1, type, color = '#ffffff', text, speedMin = 30, speedMax = 120, sizeMin = 3, sizeMax = 8, gravity } = options;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const chosenColor = Array.isArray(color) ? color[Math.floor(Math.random() * color.length)] : color;
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        color: chosenColor,
        type,
        text,
        gravity,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 5
      });
    }
  };

  // Expose touch controls to HUD via callbacks
  const handleTouchLeft = useCallback((active: boolean) => { controlsRef.current.left = active; if (!active) controlsRef.current.up = false; }, []);
  const handleTouchRight = useCallback((active: boolean) => { controlsRef.current.right = active; if (!active) controlsRef.current.up = false; }, []);
  const handleTouchJump = useCallback((active: boolean) => { controlsRef.current.up = active; }, []);

  // Sub-effect to restart physics/car state when run is reset via HUD
  useEffect(() => {
    if (pointsRef.current.length > 0) {
      const startIdx = 5;
      carRef.current = {
        x: pointsRef.current[startIdx].x,
        y: pointsRef.current[startIdx].y - 20,
        vx: 0, vy: 0, angle: 0, angularVelocity: 0, fuel: 100, score: 0, distanceX: pointsRef.current[startIdx].x, speed: 0, isGrounded: false
      };
      cameraRef.current.initialized = false;
      collectiblesRef.current.forEach(c => c.collected = false);
      obstaclesRef.current.forEach(o => o.hit = false);
      pintsRef.current.forEach(p => p.passed = false);
      particlesRef.current = [];
      activeCrisisRef.current = null;
      crisisAlertTimerRef.current = 0;
      setActiveAlert(null);
      playVroomSFX();
    }
  }, [store.runVersion]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controls
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (store.isCrashed) return;
      if (localStorage.getItem('trading_game_terms_agreed') !== 'true') return;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') controlsRef.current.right = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') controlsRef.current.left = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') controlsRef.current.up = true;
    };
    const up = (e: KeyboardEvent) => {
      if (localStorage.getItem('trading_game_terms_agreed') !== 'true') return;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') controlsRef.current.right = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') controlsRef.current.left = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') controlsRef.current.up = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [store.isCrashed]);

  // Init Data
  useEffect(() => {
    let active = true;

    const setupData = async () => {
      setDataLoading(true);
      const profile = PAIR_PROFILES[store.currencyPair];
      
      let realData: DataPoint[];
      if (store.timeRange === 'MAX') {
         realData = generateMaxHistoricalData(store.currencyPair);
      } else {
         // Fetch the last 15 days of real historical data to generate the track
         // If timeRange is 1D or LIVE, we still fetch a few days to create a long drivable track
         let daysToFetch = 15;
         if (store.timeRange === '1M') daysToFetch = 30;
         if (store.timeRange === '5D') daysToFetch = 5;
         if (store.timeRange === '1Y') daysToFetch = 60; // Approximate
         
         realData = await fetchHistoricalDataPoints(store.currencyPair, daysToFetch, store.apiProvider);
      }
      
      if (!active) return;

      const trackLength = 250;
      const rawData = generateTerrainData(store.currencyPair, trackLength, realData);
      rawDataRef.current = rawData;

      const canvasTargetH = canvasRef.current?.height || window.innerHeight;

      // Precompute min/max ONCE (not every frame)
      let minPrice = Infinity, maxPrice = -Infinity;
      let maxIdx = 0, minIdx = 0;
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i].price > maxPrice) { maxPrice = rawData[i].price; maxIdx = i; }
        if (rawData[i].price < minPrice) { minPrice = rawData[i].price; minIdx = i; }
      }
      const range = (maxPrice - minPrice) || 1;
      globalPriceRangeRef.current = { min: minPrice, max: maxPrice, range };

      maxMinRef.current = { maxIdx, minIdx, maxPrice, minPrice };

      // Crisis zones are synchronized to the selected time range.
      // MAX shows historical events; shorter ranges only show nearby events.
      crisisZonesRef.current = getCrisisZones(store.currencyPair, store.timeRange);
      activeCrisisRef.current = null;
      crisisAlertTimerRef.current = 0;
      
      // Y maps to 10% to 90% of actual canvas height to make it less flat
      pointsRef.current = rawData.map((d, i) => {
         const normalizedY = 1.0 - ((d.price - minPrice) / range);
         return {
           x: i * POINT_SPACING,
           y: canvasTargetH * 0.1 + normalizedY * (canvasTargetH * 0.8)
         };
      });

      // Generate some collectibles, obstacles, and pints checkpoints
      collectiblesRef.current = [];
      obstaclesRef.current = [];
      pintsRef.current = [];

      for (let i = 10; i < pointsRef.current.length - 10; i++) {
        // Guarantee checkpoints are spaced out beautifully (e.g. every 55 nodes)
        if (i % 55 === 0 && i < pointsRef.current.length - 20) {
          pintsRef.current.push({
            id: Math.random(),
            x: pointsRef.current[i].x,
            y: pointsRef.current[i].y,
            passed: false,
            name: `PINT ${Math.floor(i / 55)}`
          });
        } else if (i % 5 === 0) {
          // Spawn collectibles
          if (Math.random() > 0.55) {
            collectiblesRef.current.push({
              id: Math.random(),
              x: pointsRef.current[i].x,
              y: pointsRef.current[i].y - 30 - Math.random() * 55,
              type: Math.random() > 0.82 ? 'FUEL' : 'COIN',
              collected: false
            });
          }
        } else if (i % 14 === 0) {
          // Spawn obstacles (rintangan) avoiding checkpoint nodes
          if (Math.random() > 0.45 && Math.abs(i % 55) > 4) {
             const type = Math.random() > 0.45 ? 'BARRICADE' : 'ROCK';
             obstaclesRef.current.push({
               id: Math.random(),
               x: pointsRef.current[i].x,
               y: pointsRef.current[i].y,
               type: type,
               width: type === 'BARRICADE' ? 24 : 18,
               height: type === 'BARRICADE' ? 30 : 16,
               hit: false
             });
          }
        }
      }

      // Reset Car safely on top of ground
      const startIdx = 5;
      carRef.current = {
        x: pointsRef.current[startIdx].x,
        y: pointsRef.current[startIdx].y - 20, // Drop just slightly to land smooth
        vx: 0,
        vy: 0,
        angle: 0,
        angularVelocity: 0,
        fuel: 100,
        score: 0,
        distanceX: pointsRef.current[startIdx].x,
        isGrounded: false,
        speed: 0
      };
      
      cameraRef.current.initialized = false;
      const lastPoint = rawData[rawData.length - 1];
      const prevPoint = rawData[Math.max(0, rawData.length - 60)];
      
      // Determine tips language based on currency pairing
      let list = enTips;
      if (store.currencyPair.includes('IDR')) {
        list = idrTips;
      } else if (store.currencyPair.includes('JPY')) {
        list = jpyTips;
      }
      
      const randIdx = Math.floor(Math.random() * list.length);
      dialogueTipRef.current = {
        text: list[randIdx],
        timer: 6500, // Show first tip for 6.5s
        phase: "FADE_IN",
        index: randIdx,
        opacity: 0,
        springY: -20, // offset animation
        selectedList: list
      };

      store.updateMarketData(lastPoint.price, lastPoint.price - prevPoint.price);
      setDataLoading(false);
    };

    setupData();

    return () => { active = false; };
  }, [store.currencyPair, store.timeRange]);

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;

      if (pointsRef.current.length === 0) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Dialogue Tip State Machine Ticking
      const dial = dialogueTipRef.current;
      dial.timer -= dt * 1000; // decrement by ms

      // Smooth offset bounce animation (spring toward 0)
      dial.springY += (0 - dial.springY) * 0.12;

      if (dial.timer <= 0) {
        if (dial.phase === 'FADE_IN') {
          dial.phase = 'SHOW';
          dial.timer = 7000; // keep showing for 7 seconds
          dial.opacity = 1;
        } else if (dial.phase === 'SHOW') {
          dial.phase = 'FADE_OUT';
          dial.timer = 350; // fade out for 0.35 seconds
        } else if (dial.phase === 'FADE_OUT') {
          dial.phase = 'SILENCE';
          dial.timer = 2500; // stay silent for 2.5 seconds
          dial.opacity = 0;
        } else if (dial.phase === 'SILENCE') {
          // Switch to new random tip
          const nextIdx = (dial.index + 1) % dial.selectedList.length;
          dial.index = nextIdx;
          dial.text = dial.selectedList[nextIdx];
          dial.phase = 'FADE_IN';
          dial.timer = 350; // fade in for 0.35 seconds
          dial.springY = -25; // bounce visual pop!
        }
      } else {
        // Opacity interpolation based on current phase and timer
        if (dial.phase === 'FADE_IN') {
          dial.opacity = Math.min(1, 1 - (dial.timer / 350));
        } else if (dial.phase === 'FADE_OUT') {
          dial.opacity = Math.max(0, dial.timer / 350);
        } else if (dial.phase === 'SHOW') {
          dial.opacity = 1;
        } else {
          dial.opacity = 0;
        }
      }

      // PHYSICS UPDATE
      const car = carRef.current;
      const c = controlsRef.current;
      const points = pointsRef.current;
      
      const currentStateLoop = useGameStore.getState();
      
      if (!currentStateLoop.isCrashed) {
        // Live mode ticking
        if (currentStateLoop.timeRange === 'LIVE') {
           tickTimerRef.current += dt;
           if (tickTimerRef.current > 1.0) { // Every 1 sec
              tickTimerRef.current = 0;
              const lastData = rawDataRef.current[rawDataRef.current.length - 1];
              const newData = generateNextTick(currentStateLoop.currencyPair, lastData.price);
              rawDataRef.current.push(newData);
              
              store.updateMarketData(newData.price, newData.price - rawDataRef.current[Math.max(0, rawDataRef.current.length - 60)].price);
              
              // Recalculate Y based on new window? Simplified: just append point
              const lastPoint = points[points.length-1];
              // Relative Y calculation based on price
              const oldDiff = (newData.price - lastData.price) / lastData.price; // percentage
              points.push({
                 x: lastPoint.x + POINT_SPACING,
                 y: Math.max(50, Math.min(height * 2, lastPoint.y - oldDiff * height * 10))
              });
              
              // Generate some random coins
              if (Math.random() > 0.6) {
                collectiblesRef.current.push({
                  id: Math.random(),
                  x: lastPoint.x + POINT_SPACING,
                  y: lastPoint.y - 40 - Math.random() * 50,
                  type: Math.random() > 0.8 ? 'FUEL' : 'COIN',
                  collected: false
                });
              }
           }
        }

        // Proactive Infinite Track Generation when nearing the end
        if (points.length > 0 && car.x > points[points.length - 100].x) {
          const pointsToExtend = 120;
          for (let k = 0; k < pointsToExtend; k++) {
            const lastData = rawDataRef.current[rawDataRef.current.length - 1];
            const newData = generateNextTick(currentStateLoop.currencyPair, lastData.price);
            rawDataRef.current.push(newData);
            
            const lastPoint = points[points.length - 1];
            const oldDiff = (newData.price - lastData.price) / (lastData.price || 1);
            
            points.push({
              x: lastPoint.x + POINT_SPACING,
              y: Math.max(height * 0.15, Math.min(height * 1.5, lastPoint.y - oldDiff * height * 10))
            });

            const newIndex = points.length - 1;
            // Space checkpoints every 55 nodes
            if (newIndex % 55 === 0) {
              pintsRef.current.push({
                id: Math.random(),
                x: points[newIndex].x,
                y: points[newIndex].y,
                passed: false,
                name: `PINT ${Math.floor(newIndex / 55)}`
              });
            } else if (newIndex % 5 === 0) {
              if (Math.random() > 0.55) {
                collectiblesRef.current.push({
                   id: Math.random(),
                   x: points[newIndex].x,
                   y: points[newIndex].y - 30 - Math.random() * 55,
                   type: Math.random() > 0.82 ? 'FUEL' : 'COIN',
                   collected: false
                });
              }
            } else if (newIndex % 14 === 0) {
              if (Math.random() > 0.45 && Math.abs(newIndex % 55) > 4) {
                 const type = Math.random() > 0.45 ? 'BARRICADE' : 'ROCK';
                 obstaclesRef.current.push({
                   id: Math.random(),
                   x: points[newIndex].x,
                   y: points[newIndex].y,
                   type: type,
                   width: type === 'BARRICADE' ? 24 : 18,
                   height: type === 'BARRICADE' ? 16 : 14,
                   hit: false
                 });
              }
            }
          }
        }

        // O(1) segment index (replaces the old O(n) findIndex approach)
        const computedIndex = Math.floor(car.x / POINT_SPACING);
        let segmentIndex = Math.max(0, Math.min(points.length - 2, computedIndex));

        // ── Crisis zone detection ──
        const prevCrisis = activeCrisisRef.current;
        activeCrisisRef.current = crisisZonesRef.current.find(
          z => computedIndex >= z.startIdx && computedIndex <= z.endIdx
        ) ?? null;
        // Entered a new crisis zone
        if (!prevCrisis && activeCrisisRef.current) {
          crisisAlertTimerRef.current = 5000;
          store.setCaruState('DETERMINED');
          setActiveAlert({ text: `⚠️ ${activeCrisisRef.current.label} — Bertahan!`, type: 'BAD', id: Math.random() });
        }
        // Just exited a crisis zone → award bonus
        if (prevCrisis && !activeCrisisRef.current) {
          car.score += 200;
          store.updateGameStats({ crisisZonesSurvived: useGameStore.getState().crisisZonesSurvived + 1 });
          spawnParticles({ x: car.x, y: car.y - 50, count: 30, type: 'confetti', color: ['#4285f4','#34a853','#fbbc05','#ea4335','#a142f4'], speedMin: 80, speedMax: 220, sizeMin: 3, sizeMax: 7, gravity: 120 });
          spawnParticles({ x: car.x, y: car.y - 60, count: 1, type: 'text', color: '#fbbc04', text: '✅ Survived! +200', speedMin: 20, speedMax: 40, sizeMin: 14, sizeMax: 14, gravity: -50 });
          setActiveAlert({ text: `✅ Zona krisis dilewati! +200 Poin!`, type: 'GOOD', id: Math.random() });
          store.setCaruState('EXCITED');
          playCheckpointSFX();
        }
        // Decrement crisis alert timer
        if (crisisAlertTimerRef.current > 0) crisisAlertTimerRef.current -= dt * 1000;
        
        // Clamp bounds (safe left-edge, infinite right edge)
        if (car.x < points[0].x) { car.x = points[0].x; car.vx = 0; }
        if (car.x > points[points.length-1].x) { car.x = points[points.length-1].x; car.vx = 0; }

        const gravity = 800; // px/s^2
        car.vy += gravity * dt;
        
        car.x += car.vx * dt;
        car.y += car.vy * dt;
        car.angle += car.angularVelocity * dt;

        let terrainY = height;
        let terrainAngle = 0;

        if (segmentIndex >= 0) {
          const p1 = points[segmentIndex];
          const p2 = points[segmentIndex+1];
          const t = (car.x - p1.x) / (p2.x - p1.x);
          terrainY = p1.y + t * (p2.y - p1.y);
          terrainAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        }

        const carBottom = car.y + 15; // approximate wheel radius
        car.isGrounded = false;

        // Collision with ground
        if (carBottom >= terrainY && segmentIndex >= 0) {
          car.y = terrainY - 15;
          car.vy = 0;
          car.isGrounded = true;
          
          // Match terrain angle somewhat smoothly
          const angleDiff = terrainAngle - car.angle;
          // Normalize angleDiff
          let nDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          car.angularVelocity = nDiff * 15; // align to ground
          
          // Project velocity along terrain
          const speed = Math.sqrt(car.vx*car.vx + car.vy*car.vy);
          const dir = car.vx > 0 ? 1 : -1;
          
          let engineForce = 0;
          if (c.right && car.fuel > 0) engineForce = 1500;
          if (c.left && car.fuel > 0) engineForce = -1500;
          
          // Friction and engine
          const friction = 200;
          car.speed += (engineForce * dt);
          if (!c.right && !c.left) {
             if (car.speed > 0) car.speed = Math.max(0, car.speed - friction * dt);
             if (car.speed < 0) car.speed = Math.min(0, car.speed + friction * dt);
          }
           // Gravity slope effect (roll downhill)
          car.speed += Math.sin(terrainAngle) * gravity * dt * 0.5;

          // Velocity vectors
          car.vx = Math.cos(terrainAngle) * car.speed;
          car.vy = Math.sin(terrainAngle) * car.speed;
          
          // Jump
          if (c.up && car.fuel > 5) {
             car.vy = -400; // Jump impulse
             car.y -= 5;
             car.fuel -= 5;
             car.isGrounded = false;
             playJumpSFX();
          }
          
          if (c.right || c.left) {
             car.fuel -= 1 * dt;
          }
        } else {
           // In air controls (flip rotation)
           if (c.left) car.angularVelocity -= 10 * dt;
           if (c.right) car.angularVelocity += 10 * dt;
           
           // Calculate speed for air movement
           car.speed = car.vx;
           
           // Air damping
           car.angularVelocity *= 0.98;
        }

        let nAngle = Math.atan2(Math.sin(car.angle), Math.cos(car.angle));

        // Auto flip if upside down (Pogo Bounce Mechanic!)
        if (Math.abs(nAngle) > Math.PI / 2.2 && car.isGrounded) {
             car.vy = -600; // Big bounce!
             car.angularVelocity = Math.sign(nAngle) * -12; 
             car.y -= 30;
             car.isGrounded = false;
             playJumpSFX();
             
             // Give some score for the goofy bounce
             car.score += 50;
             car.fuel = Math.min(100, car.fuel + 15);
             
             spawnParticles({
                x: car.x,
                y: car.y - 30,
                count: 1,
                type: 'text',
                text: 'BOING! +50',
                color: '#ff69b4',
                speedMin: 60,
                speedMax: 100,
                gravity: 150,
                sizeMin: 18,
                sizeMax: 18
             });
             
             // Fun confetti
             spawnParticles({
                x: car.x,
                y: car.y,
                count: 12,
                type: 'confetti',
                color: ['#ff0000', '#00ff00', '#0000ff', '#facc15', '#e879f9'],
                speedMin: 100,
                speedMax: 300,
                gravity: 300,
                sizeMin: 4,
                sizeMax: 8
             });
             
             store.setCaruState('EXCITED');
        }
        
        // Passive fuel regen so we never get completely stuck
        if (car.fuel <= 0 && car.speed < 10) {
             car.fuel += 20 * dt; // quick burst if completely dead to keep you moving
        } else if (car.fuel < 100) {
             car.fuel += 1 * dt; // slow passive regen
        }

        // Prune far-behind entities to prevent memory growth on long runs
        const pruneX = car.x - 1500;
        collectiblesRef.current = collectiblesRef.current.filter(c => c.x > pruneX || !c.collected);
        obstaclesRef.current = obstaclesRef.current.filter(o => o.x > pruneX || !o.hit);

        // Collectibles collision
        for (let coin of collectiblesRef.current) {
          if (!coin.collected) {
            const dx = coin.x - car.x;
            const dy = coin.y - car.y;
            if (dx*dx + dy*dy < 1600) { // 40px radius
              coin.collected = true;
              if (coin.type === 'COIN') {
                 car.score += 10;
                 store.awardCoins(10);
                 
                 const currentRunCoins = useGameStore.getState().runCoins;
                 if (currentRunCoins >= 50) {
                    store.addAchievement('Pembangun Kekayaan');
                 }

                 store.setCaruState('EXCITED');
                 playCoinSFX();
                 
                 // Spawn golden coin sparks & points text
                 spawnParticles({
                   x: coin.x,
                   y: coin.y,
                   count: 12,
                   type: 'spark',
                   color: ['#fbbc04', '#fff59d', '#f29900'],
                   speedMin: 60,
                   speedMax: 160,
                   sizeMin: 1.5,
                   sizeMax: 4
                 });
                 spawnParticles({
                   x: coin.x,
                   y: coin.y - 12,
                   count: 1,
                   type: 'text',
                   color: '#fcb004',
                   text: '+10',
                   speedMin: 15,
                   speedMax: 30,
                   sizeMin: 13,
                   sizeMax: 13,
                   gravity: -40
                 });
                 // Sparkle star emoji bubble
                 spawnParticles({
                   x: coin.x,
                   y: coin.y - 15,
                   count: 2,
                   type: 'emoji',
                   text: '⭐',
                   speedMin: 15,
                   speedMax: 35,
                   sizeMin: 15,
                   sizeMax: 18
                 });
              } else if (coin.type === 'FUEL') {
                 car.fuel = Math.min(100, car.fuel + 40); // clamp fuel back to 100 max
                 playFuelSFX();
                 
                 // Green exhaust/fuel sparks
                 spawnParticles({
                   x: coin.x,
                   y: coin.y,
                   count: 10,
                   type: 'smoke',
                   color: ['#34a853', '#81c995', '#a8e6cf'],
                   speedMin: 40,
                   speedMax: 90,
                   sizeMin: 4,
                   sizeMax: 8
                 });
                 spawnParticles({
                   x: coin.x,
                   y: coin.y - 12,
                   count: 1,
                   type: 'text',
                   color: '#34a853',
                   text: '⛽ +40',
                   speedMin: 15,
                   speedMax: 30,
                   sizeMin: 13,
                   sizeMax: 13,
                   gravity: -40
                 });
              }
            }
          }
        }

        // Obstacles collision (Rintangan)
        for (let obs of obstaclesRef.current) {
          if (!obs.hit) {
            const dx = obs.x - car.x;
            const dy = obs.y - car.y;
            // Car box approx check (width ~40px, height ~30px)
            if (Math.abs(dx) < (obs.width / 2 + 12) && Math.abs(dy) < (obs.height / 2 + 15)) {
               obs.hit = true;
               car.speed = -Math.abs(car.speed) * 0.4; // Reverse speed slightly / knockback
               car.vx = -120;
               car.vy = -160; // Bouncy hit up
               car.y -= 8;
               car.isGrounded = false;
               car.fuel = Math.max(0, car.fuel - 15); // drain fuel
               store.setCaruState('SCARED');
               playCrashSFX();
              
              // Spawn crash explosive sparks and dark warning smoke!
              spawnParticles({
                x: obs.x,
                y: obs.y - 10,
                count: 15,
                type: 'smoke',
                color: ['#3c4043', '#202124', '#ea4335'],
                speedMin: 40,
                speedMax: 140,
                sizeMin: 5,
                sizeMax: 10
              });
              spawnParticles({
                x: obs.x,
                y: obs.y - 10,
                count: 18,
                type: 'spark',
                color: ['#fbbc04', '#ea4335', '#ffffff'],
                speedMin: 70,
                speedMax: 200,
                sizeMin: 2,
                sizeMax: 4.5
              });
              spawnParticles({
                x: car.x,
                y: car.y - 25,
                count: 1,
                type: 'emoji',
                text: '💥',
                speedMin: 10,
                speedMax: 25,
                sizeMin: 22,
                sizeMax: 26
              });
              // Scared water sweatdrop
              spawnParticles({
                x: car.x + 8,
                y: car.y - 28,
                count: 1,
                type: 'emoji',
                text: '💧',
                speedMin: 15,
                speedMax: 30,
                sizeMin: 13,
                sizeMax: 16
              });

              setActiveAlert({
                text: `💥 Kena Rintangan! Bensin -15⛽ & Kecepatan Berkurang!`,
                type: 'BAD',
                id: Math.random()
              });
              car.score = Math.max(0, car.score - 5);

              // Responsive Dialogue Warning Tip!
              const dangerTipsList = dialogueTipRef.current.selectedList;
              dialogueTipRef.current = {
                text: store.currencyPair.includes('IDR') 
                  ? "💥 Krisis finansial! Pengeluaran mendadak mendisrupsi bensin (likuiditas / cashflow) kita!"
                  : "💥 Sudden negative shock! Unplanned expenses hit our portfolio stability!",
                timer: 5000,
                phase: "SHOW",
                index: dialogueTipRef.current.index,
                opacity: 1,
                springY: -30,
                selectedList: dangerTipsList
              };
            }
          }
        }

        // Pints/Checkpoints collision (Pint)
        for (let pint of pintsRef.current) {
          if (!pint.passed) {
             const dx = pint.x - car.x;
             if (Math.abs(dx) < 22 && Math.abs(pint.y - car.y) < 80) {
               pint.passed = true;
               car.score += 50;
               car.fuel = Math.min(100, car.fuel + 45);
               store.awardCoins(50);
               store.setCaruState('VICTORIOUS');
               playCheckpointSFX();
               store.updateGameStats({ checkpointsPassed: useGameStore.getState().checkpointsPassed + 1 });

               const successTipsList = dialogueTipRef.current.selectedList;
               dialogueTipRef.current = {
                 text: store.currencyPair.includes('IDR')
                   ? "🏆 Rencana anggaran berjalan mantap! Dividen meningkat, likuiditas kita aman!"
                   : "🏆 Target milestone achieved! Healthy cash flow maintains high stability!",
                 timer: 5500, phase: "SHOW",
                 index: dialogueTipRef.current.index, opacity: 1, springY: -30,
                 selectedList: successTipsList
               };

               spawnParticles({ x: pint.x, y: pint.y - 45, count: 35, type: 'confetti',
                 color: ['#4285f4','#34a853','#fbbc05','#ea4335','#a142f4','#24c1e0'],
                 speedMin: 80, speedMax: 220, sizeMin: 3.5, sizeMax: 7, gravity: 120 });
               spawnParticles({ x: pint.x, y: pint.y - 55, count: 1, type: 'text',
                 color: '#137333', text: '+50 POIN!', speedMin: 35, speedMax: 50, sizeMin: 14, sizeMax: 14, gravity: -60 });
               spawnParticles({ x: car.x, y: car.y - 30, count: 3, type: 'emoji',
                 text: '🎉', speedMin: 30, speedMax: 70, sizeMin: 16, sizeMax: 22 });

               setActiveAlert({ text: `🏁 Checkpoint! +50 Poin & +45 Bensin!`, type: 'GOOD', id: Math.random() });
             }
          }
        }

        car.distanceX = Math.max(car.distanceX, car.x);

        // ── Run finish: reached near end of base track (index 240+) ──
        if (computedIndex >= 238 && useGameStore.getState().gameScreen === 'PLAYING') {
          store.updateGameStats({ fuel: Math.floor(car.fuel), score: car.score, distance: Math.floor(car.distanceX / 2.5) });
          store.addAchievement('Penyintas Pasar');
          store.finishRun();
        }
      }

      // Timer-based store sync every 200ms (replaces the random Math.random() hack)
      if (time - lastStoreSyncRef.current > 200) {
        lastStoreSyncRef.current = time;
        store.updateGameStats({
          fuel: Math.max(0, Math.floor(car.fuel)),
          score: car.score,
          distance: Math.floor(car.distanceX / 2.5)
        });

        const currentSegmentIndex = Math.max(0, Math.min(points.length - 2, Math.floor(car.x / POINT_SPACING)));
        const currentDataPoint = rawDataRef.current[currentSegmentIndex];
        if (currentDataPoint) {
          const baseIndex = Math.max(0, currentSegmentIndex - 60);
          const baseDataPoint = rawDataRef.current[baseIndex] || currentDataPoint;
          store.updateMarketData(currentDataPoint.price, currentDataPoint.price - baseDataPoint.price);
        }

        if (!useGameStore.getState().isCrashed) {
          if (activeCrisisRef.current) store.setCaruState('DETERMINED');
          else if (car.vy > 200 && !car.isGrounded) store.setCaruState('SCARED');
          else if (car.vy < -200 && !car.isGrounded) store.setCaruState('EXCITED');
          else if (Math.abs(car.vx) < 50) store.setCaruState('SLEEPY');
          else store.setCaruState('HAPPY');
        }
      }

      // CAMERA UPDATE
      const targetCamX = car.x - width * 0.3; // Car at 30% from left
      let targetCamY = car.y - height * 0.6; // Car at 60% from top
      
      if (!cameraRef.current.initialized) {
          cameraRef.current.x = targetCamX;
          cameraRef.current.y = targetCamY;
          cameraRef.current.initialized = true;
      } else {
          // Tightly lock camera onto car to ensure it never stops following
          cameraRef.current.x += (targetCamX - cameraRef.current.x) * 12 * dt;
          cameraRef.current.y += (targetCamY - cameraRef.current.y) * 12 * dt;
      }

      // RENDER
      const currentPair = useGameStore.getState().currencyPair;
      
      // Dynamic Theme Based on Pair
      let bgTop = '#202124', bgBottom = '#202124', gridColor = '#3c4043';
      let terrainGradTop = 'rgba(255,255,255,0.05)', terrainGradBottom = 'rgba(0,0,0,0.5)';
      
      switch(currentPair) {
        case 'BTC/USD': // Cyberpunk/Space
          bgTop = '#0B0B1A'; bgBottom = '#1A0B2E';
          gridColor = '#2D1B4E';
          terrainGradTop = 'rgba(157, 78, 221, 0.2)';
          terrainGradBottom = 'rgba(90, 24, 154, 0.8)';
          break;
        case 'USD/IDR': // Tropical
          bgTop = '#1E3A5F'; bgBottom = '#0F1C2E';
          gridColor = '#2A4D7A';
          terrainGradTop = 'rgba(40, 167, 69, 0.15)';
          terrainGradBottom = 'rgba(19, 89, 34, 0.7)';
          break;
        case 'EUR/USD': // European Cobblestone
          bgTop = '#2C3539'; bgBottom = '#1A2022';
          gridColor = '#414E54';
          terrainGradTop = 'rgba(135, 154, 166, 0.15)';
          terrainGradBottom = 'rgba(44, 53, 57, 0.8)';
          break;
        case 'USD/JPY': // Neon Tokyo
          bgTop = '#140624'; bgBottom = '#2B0A3D';
          gridColor = '#4A154B';
          terrainGradTop = 'rgba(255, 107, 214, 0.15)';
          terrainGradBottom = 'rgba(148, 17, 104, 0.6)';
          break;
        case 'AUD/USD': // Outback Red
          bgTop = '#3D1C04'; bgBottom = '#1F0D01';
          gridColor = '#5C2D08';
          terrainGradTop = 'rgba(235, 81, 23, 0.15)';
          terrainGradBottom = 'rgba(122, 34, 1, 0.8)';
          break;
        default:
          bgTop = '#202124'; bgBottom = '#202124';
          gridColor = '#3c4043';
          terrainGradTop = 'rgba(255,255,255,0.05)';
          terrainGradBottom = 'rgba(0,0,0,0.5)';
      }

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, bgTop);
      bgGrad.addColorStop(1, bgBottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // ── O(1) visible range (replaces old O(n) findIndex!) ──
      const firstVisible = Math.max(0, Math.floor((cameraRef.current.x - 200) / POINT_SPACING));
      const lastVisible = Math.min(points.length - 1, Math.ceil((cameraRef.current.x + width + 200) / POINT_SPACING));

      // Clamp visible Y range for grid (scan only visible slice, max ~30 points)
      let minP = Infinity, maxP = -Infinity;
      for (let vi = firstVisible; vi <= lastVisible && vi < points.length; vi++) {
        if (points[vi].y < minP) minP = points[vi].y;
        if (points[vi].y > maxP) maxP = points[vi].y;
      }
      if (minP === Infinity) { minP = 100; maxP = 500; }
      const gridSpacingY = (maxP - minP) / 4 || 100;

      // Draw Grid / Background (Horizontal only like Google Finance)
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      for (let y = minP; y <= maxP; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y - cameraRef.current.y);
        ctx.lineTo(width, y - cameraRef.current.y);
        ctx.stroke();
      }
      
      // ── Crisis zone background tint ──
      if (activeCrisisRef.current) {
        const severity = activeCrisisRef.current.severity;
        const intensity = severity === 'EXTREME' ? 0.18 : severity === 'SEVERE' ? 0.12 : 0.07;
        const crisisGrad = ctx.createLinearGradient(0, 0, 0, height);
        crisisGrad.addColorStop(0, `rgba(234, 67, 53, ${intensity})`);
        crisisGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = crisisGrad;
        ctx.fillRect(0, 0, width, height);
        // Lightning flash effect on EXTREME zones
        if (severity === 'EXTREME' && Math.random() < 0.01) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.save();
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // Draw Terrain Polygon
      const currentState = useGameStore.getState();
      const isUp = currentState.priceChange >= 0;
      const lineColor = isUp ? '#81c995' : '#F28B82';

      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[firstVisible].x, cameraRef.current.y + height + 500); // go deep
        for (let i = firstVisible; i <= lastVisible && i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[lastVisible].x, cameraRef.current.y + height + 500); // Close
        ctx.closePath();
        
        const terrGrad = ctx.createLinearGradient(0, cameraRef.current.y, 0, cameraRef.current.y + height + 200);
        terrGrad.addColorStop(0, terrainGradTop);
        terrGrad.addColorStop(1, terrainGradBottom);
        ctx.fillStyle = terrGrad;
        ctx.fill();
        
        // Draw Max / Min Markers & Time Labels
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '12px "Google Sans", sans-serif';
        ctx.textAlign = 'center';
        
        // Time labels every ~10 points
        for (let i = firstVisible; i <= lastVisible && i < points.length; i++) {
           if (i % 10 === 0) {
              const pt = points[i];
              if (rawDataRef.current[i]) {
                 const date = new Date(rawDataRef.current[i].time);
                 let labelStr = '';
                 const tr = store.timeRange;
                 if (tr === '1D' || tr === 'LIVE') {
                    labelStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                 } else if (tr === '5D' || tr === '1M') {
                    labelStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
                 } else {
                    // 1Y or MAX
                    labelStr = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', timeZone: 'UTC' });
                 }
                 ctx.fillText(labelStr, pt.x, height + cameraRef.current.y - 20);
                 
                 // Small vertical tick
                 ctx.beginPath();
                 ctx.moveTo(pt.x, height + cameraRef.current.y - 40);
                 ctx.lineTo(pt.x, height + cameraRef.current.y - 35);
                 ctx.strokeStyle = '#5f6368';
                 ctx.stroke();
              }
           }
        }
        
        // Draw MAX and MIN point indicators
        const drawMarker = (idx: number, label: string) => {
            if (idx >= firstVisible && idx <= lastVisible && points[idx]) {
                const pt = points[idx];
                const priceStr = rawDataRef.current[idx].price.toLocaleString(undefined, { maximumFractionDigits: 2 });
                ctx.fillStyle = label === 'MAX' ? '#81c995' : '#F28B82';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 6, 0, Math.PI*2);
                ctx.fill();
                
                ctx.fillStyle = '#e8eaed';
                ctx.font = 'bold 12px "Google Sans", sans-serif';
                ctx.fillText(`${label}`, pt.x, pt.y - 25);
                ctx.font = '12px "Google Sans", sans-serif';
                ctx.fillText(`${priceStr}`, pt.x, pt.y - 12);
            }
        };
        drawMarker(maxMinRef.current.maxIdx, 'MAX');
        drawMarker(maxMinRef.current.minIdx, 'MIN');

        // Draw Line
        ctx.beginPath();
        for (let i = firstVisible; i <= lastVisible && i < points.length; i++) {
           if (i === firstVisible) ctx.moveTo(points[i].x, points[i].y);
           else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw Collectibles
      for (let coin of collectiblesRef.current) {
        if (!coin.collected && coin.x > cameraRef.current.x - 100 && coin.x < cameraRef.current.x + width + 100) {
          ctx.save();
          ctx.translate(coin.x, coin.y + Math.sin(time/200)*5); // hover effect
          if (coin.type === 'COIN') {
             ctx.fillStyle = '#fbbc04'; // Google Yellow
             ctx.beginPath();
             ctx.arc(0, 0, 10, 0, Math.PI*2);
             ctx.fill();
             ctx.fillStyle = '#f29900';
             ctx.beginPath();
             ctx.arc(0, 0, 6, 0, Math.PI*2);
             ctx.fill();
          } else {
             ctx.fillStyle = '#ea4335'; // Google Red
             ctx.beginPath();
             ctx.roundRect(-8, -10, 16, 20, 4);
             ctx.fill();
             ctx.fillStyle = '#fff';
             ctx.fillRect(-4, -5, 8, 4);
          }
          ctx.restore();
        }
      }

      // Draw Pints (Checkpoints)
      for (let pint of pintsRef.current) {
        if (pint.x > cameraRef.current.x - 100 && pint.x < cameraRef.current.x + width + 100) {
          ctx.save();
          ctx.translate(pint.x, pint.y);
          
          // Draw flagpole/neon posts
          ctx.strokeStyle = pint.passed ? '#5f6368' : '#8ab4f8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -65);
          ctx.stroke();
          
          // Glow indicator
          if (!pint.passed) {
             ctx.fillStyle = 'rgba(129, 201, 149, 0.25)'; // glowing light green
             ctx.beginPath();
             ctx.arc(0, -65, 14 + Math.sin(time/150)*4, 0, Math.PI*2);
             ctx.fill();
             
             // Flag shape
             ctx.fillStyle = '#81c995'; // Active flag (green)
          } else {
             ctx.fillStyle = '#5f6368'; // Passed (inactive gray)
          }
          ctx.beginPath();
          ctx.moveTo(0, -65);
          ctx.lineTo(25, -55 + Math.sin(time/200)*3);
          ctx.lineTo(0, -45);
          ctx.closePath();
          ctx.fill();
          
          // Draw "PINT" label text above checkpoint pole
          ctx.fillStyle = pint.passed ? '#5f6368' : '#81c995';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(pint.name, 0, -75);
          
          ctx.restore();
        }
      }

      // Draw Obstacles (Rintangan)
      for (let obs of obstaclesRef.current) {
        if (obs.x > cameraRef.current.x - 100 && obs.x < cameraRef.current.x + width + 100) {
          ctx.save();
          ctx.translate(obs.x, obs.y);
          
          if (obs.type === 'BARRICADE') {
            const w = obs.width;
            const h = obs.height;
            
            // Draw barricade legs
            ctx.strokeStyle = '#9aa0a6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-w/2, 0);
            ctx.lineTo(-w/2 + 4, -h);
            ctx.moveTo(w/2, 0);
            ctx.lineTo(w/2 - 4, -h);
            ctx.stroke();
            
            // Panel board
            ctx.fillStyle = obs.hit ? '#3c4043' : '#f29900'; // orange barricade
            ctx.beginPath();
            ctx.roundRect(-w/2 - 2, -h + 6, w + 4, 11, 2);
            ctx.fill();
            
            // White warning stripes
            if (!obs.hit) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(-w/2 + 4, -h + 15);
              ctx.lineTo(-w/2 + 12, -h + 8);
              ctx.moveTo(w/2 - 12, -h + 15);
              ctx.lineTo(w/2 - 4, -h + 8);
              ctx.stroke();
            }
          } else {
            // ROCK (Draw uneven stone obstacle)
            const w = obs.width;
            const h = obs.height;
            ctx.fillStyle = obs.hit ? '#424548' : '#70757a'; // darker gray boulder
            ctx.beginPath();
            ctx.moveTo(-w/2, 0);
            ctx.lineTo(-w/2 - 2, -h/2);
            ctx.lineTo(-w/4, -h);
            ctx.lineTo(w/4, -h - 2);
            ctx.lineTo(w/2, -h/2);
            ctx.lineTo(w/2 + 2, 0);
            ctx.closePath();
            ctx.fill();
            
            // Detail surface cracks
            ctx.strokeStyle = '#4d5156';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-w/4, -h/2);
            ctx.lineTo(w/4, -h/3);
            ctx.stroke();
          }
          
          ctx.restore();
        }
      }

      // Continuous exhaust & tire dust particle generators
      if (!currentStateLoop.isCrashed) {
        // Rear tire dust
        if (car.isGrounded && Math.abs(car.speed) > 10) {
           if (Math.random() < 0.22) {
              const wheelGlobalX = car.x - 15 * Math.cos(car.angle) + 6 * Math.sin(car.angle);
              const wheelGlobalY = car.y - 15 * Math.sin(car.angle) + 6 * Math.cos(car.angle);
              spawnParticles({
                x: wheelGlobalX,
                y: wheelGlobalY + 3,
                count: 1,
                type: 'smoke',
                color: isUp ? 'rgba(129, 201, 149, 0.4)' : 'rgba(242, 139, 130, 0.4)',
                speedMin: 10,
                speedMax: 35,
                sizeMin: 3.5,
                sizeMax: 7.5,
                gravity: -15
              });
           }
        }

        // Exhaust smoke / nitrous fire sparks
        if (c.right && car.fuel > 0) {
           if (Math.random() < 0.35) {
              const exhGlobalX = car.x - 26 * Math.cos(car.angle);
              const exhGlobalY = car.y - 26 * Math.sin(car.angle) - 2;
              spawnParticles({
                x: exhGlobalX,
                y: exhGlobalY,
                count: 1,
                type: 'spark',
                color: ['#fbbc04', '#ea4335', '#ffffff'],
                speedMin: 60,
                speedMax: 110,
                sizeMin: 1.5,
                sizeMax: 3.5
              });
              if (Math.random() < 0.4) {
                 spawnParticles({
                   x: exhGlobalX,
                   y: exhGlobalY,
                   count: 1,
                   type: 'smoke',
                   color: 'rgba(234, 67, 53, 0.15)',
                   speedMin: 5,
                   speedMax: 20,
                   sizeMin: 2,
                   sizeMax: 5
                 });
              }
           }
        }
        
        // Idle Sleepy bubbles "zZZ" floating up occasionally
        if (currentState.caruState === 'SLEEPY' && Math.random() < 0.015) {
           spawnParticles({
             x: car.x,
             y: car.y - 25,
             count: 1,
             type: 'text',
             color: '#e8eaed',
             text: 'zZZ',
             speedMin: 10,
             speedMax: 20,
             sizeMin: 11,
             sizeMax: 14,
             gravity: -20
           });
        }
      }

      // Update and draw live particle arrays
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * (p.type === 'emoji' || p.type === 'text' ? 1.4 : p.type === 'confetti' ? 1.2 : 2.5);
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) {
          p.vy += p.gravity * dt;
        }
        if (p.spinSpeed && p.angle !== undefined) {
          p.angle += p.spinSpeed * dt;
        }
        
        ctx.save();
        ctx.globalAlpha = p.life;
        
        if (p.type === 'smoke') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life) * 1.6), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'spark') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
          ctx.stroke();
        } else if (p.type === 'emoji' || p.type === 'text') {
          ctx.fillStyle = p.color;
          ctx.font = `bold ${p.size}px "JetBrains Mono", "Space Grotesk", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.text || '', p.x, p.y);
        } else if (p.type === 'confetti') {
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          if (p.angle !== undefined) {
             ctx.rotate(p.angle);
          }
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        
        ctx.restore();
      }

      // Draw Car (Prism-Neon Futuristic Cyberpunk Off-Road Buggy)
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      
      // 1. Futuristic Underglow Neon Light (Pulsing neon shadow)
      const glowColor = isUp ? 'rgba(129, 201, 149, 0.4)' : 'rgba(242, 139, 130, 0.4)';
      const shadowGradient = ctx.createRadialGradient(0, 5, 0, 0, 12, 35);
      shadowGradient.addColorStop(0, glowColor);
      shadowGradient.addColorStop(0.3, glowColor);
      shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.ellipse(0, 9, 32, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. High-quality Wheel Suspension dampers/springs
      const drawSuspension = (sx: number) => {
         ctx.strokeStyle = '#9aa0a6';
         ctx.lineWidth = 1.5;
         ctx.beginPath();
         ctx.moveTo(sx, -4);
         ctx.lineTo(sx, 7);
         ctx.stroke();
         
         // Metallic spring spiral detail
         ctx.strokeStyle = isUp ? '#81c995' : '#F28B82';
         ctx.lineWidth = 2.5;
         ctx.beginPath();
         for (let sy = -2; sy <= 5; sy += 2) {
           ctx.moveTo(sx - 3.5, sy);
           ctx.lineTo(sx + 3.5, sy + 1);
         }
         ctx.stroke();
      };
      drawSuspension(-15);
      drawSuspension(12);

      // 3. Roll Cage & Roof Canopy (Dual-bars steel roll bars)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#5f6368';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-15, -15);
      ctx.lineTo(-21, -38); 
      ctx.lineTo(4, -38);   
      ctx.lineTo(12, -15);  
      ctx.stroke();
      
      // Secondary parallel roll-cage bars for design volume
      ctx.strokeStyle = '#3c4043';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(-14, -32);
      ctx.lineTo(0, -32);
      ctx.lineTo(6, -15);
      ctx.stroke();

      // Roof Wing/Spoiler
      ctx.fillStyle = isUp ? '#34a853' : '#ea4335';
      ctx.beginPath();
      ctx.roundRect(-24, -39, 13, 3.5, 1);
      ctx.fill();

      // 4. Custom High-Gloss Metal Car Body Panel
      const baseGrad = ctx.createLinearGradient(-26, -16, 22, 0);
      baseGrad.addColorStop(0, '#c5221f');
      baseGrad.addColorStop(0.35, '#ea4335');
      baseGrad.addColorStop(0.5, '#f85a40');
      baseGrad.addColorStop(1, '#9b1c1c');
      ctx.fillStyle = baseGrad;
      
      ctx.beginPath();
      ctx.moveTo(-26, -16);
      ctx.lineTo(-27, -5);
      ctx.quadraticCurveTo(-20, -2, -15, -4);
      ctx.lineTo(16, -4);
      ctx.lineTo(23, -10);
      ctx.lineTo(12, -16);
      ctx.closePath();
      ctx.fill();
      
      // Sleek racing decals / accents on panel
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(-16, -6);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-2, -12);
      ctx.closePath();
      ctx.fill();

      // Cute happy smile and blush on the car itself!
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(8, -10, 1.8, 0, Math.PI, false); // happy mouth
      ctx.stroke();

      // Glowing pink cheeks on the car
      ctx.fillStyle = 'rgba(255, 128, 171, 0.7)';
      ctx.beginPath();
      ctx.arc(5, -11, 1, 0, Math.PI * 2);
      ctx.arc(11, -11, 1, 0, Math.PI * 2);
      ctx.fill();

      // Heat mesh grille on engine
      ctx.fillStyle = '#202124';
      ctx.fillRect(-22, -11, 8, 5);

      // Spare tire hubcap on back
      ctx.save();
      ctx.translate(-26, -13);
      ctx.fillStyle = '#1e1f20';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#dfe1e5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 5. LED Headlight & Bright Headlight Beam Cone
      ctx.fillStyle = '#fef7e0'; 
      ctx.beginPath();
      ctx.arc(22, -9, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Dynamic Headlight Glow Projection forward
      ctx.save();
      const beamGrad = ctx.createLinearGradient(22, -9, 110, -9);
      beamGrad.addColorStop(0, 'rgba(251, 188, 4, 0.4)');
      beamGrad.addColorStop(1, 'rgba(251, 188, 4, 0.0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(22, -9);
      ctx.lineTo(110, -23);
      ctx.lineTo(110, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Glowing taillight panel indicator
      ctx.fillStyle = '#ea4335';
      ctx.beginPath();
      ctx.arc(-26, -13, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Steering wheel structure
      ctx.strokeStyle = '#1e1f20';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(7, -15);
      ctx.lineTo(3, -23);
      ctx.stroke();
      ctx.fillStyle = '#3c4043';
      ctx.beginPath();
      ctx.arc(3, -23, 4, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Cute Driver Caru Pet (Perfect physics-based animated expressions & details!)
      ctx.save();
      // Bobbing amplitude gets bigger when speed is higher, providing continuous momentum feel
      const bounceAmplitude = Math.min(6, Math.abs(car.speed) * 0.02) + (car.isGrounded ? 0 : 2);
      const bobbing = Math.sin(time / 140) * bounceAmplitude * 0.65;
      ctx.translate(-3, -19 + bobbing);
      
      // Driver seat backing
      ctx.fillStyle = '#35373a';
      ctx.beginPath();
      ctx.roundRect(-8, -4, 4, 15, 2);
      ctx.fill();

      // Choose base skin color of Caru based on state
      let caruColor = '#fcd34d'; // default golden yellow
      if (currentState.caruState === 'SCARED') caruColor = '#ff8f00'; 
      if (currentState.caruState === 'SLEEPY') caruColor = '#ffe082'; 
      if (currentState.caruState === 'EXCITED') caruColor = '#fff59d'; 

      // Driver body torso
      ctx.fillStyle = caruColor;
      ctx.beginPath();
      ctx.roundRect(-5, -6, 11, 12, { topLeft: 4, topRight: 4, bottomLeft: 2, bottomRight: 2 });
      ctx.fill();

      // Driver cute head sphere
      ctx.beginPath();
      ctx.arc(0, -9, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Cute investor's tiny gold crown on top of head!
      ctx.save();
      ctx.fillStyle = '#fcd34d'; // Gold
      ctx.strokeStyle = '#202124';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -17);
      ctx.lineTo(-5, -22);
      ctx.lineTo(-2, -19);
      ctx.lineTo(0, -23);
      ctx.lineTo(2, -19);
      ctx.lineTo(5, -22);
      ctx.lineTo(4, -17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tiny shiny rubies (blue, red, green dots) on the gold crown tips!
      ctx.fillStyle = '#4285f4'; // Google blue
      ctx.beginPath(); ctx.arc(-5, -22, 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ea4335'; // Google red
      ctx.beginPath(); ctx.arc(0, -23, 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#34a853'; // Google green
      ctx.beginPath(); ctx.arc(5, -22, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Long animated ears (slanting backwards depending on forward wind / car speed!)
      const earSlant = (car.speed / 400) * 0.55; 
      
      // Left Ear
      ctx.save();
      ctx.fillStyle = caruColor;
      ctx.translate(-4, -15);
      ctx.rotate(-0.15 + earSlant + Math.sin(time / 100) * 0.1);
      ctx.beginPath();
      ctx.ellipse(0, -5, 2.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8bbd0'; // Pink inner ear
      ctx.beginPath();
      ctx.ellipse(0, -5, 1.2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right Ear
      ctx.save();
      ctx.fillStyle = caruColor;
      ctx.translate(3, -15);
      ctx.rotate(0.15 + earSlant + Math.cos(time / 100) * 0.1);
      ctx.beginPath();
      ctx.ellipse(0, -5, 2.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8bbd0'; // Pink inner ear
      ctx.beginPath();
      ctx.ellipse(0, -5, 1.2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eyes with animated state blinks!
      ctx.fillStyle = '#202124';
      const isBlinking = Math.floor(time / 185) % 25 === 0;
      
      if (isBlinking || currentState.caruState === 'SLEEPY') {
         ctx.lineWidth = 1.3;
         ctx.strokeStyle = '#202124';
         ctx.beginPath();
         ctx.arc(-2.5, -9, 1.5, Math.PI, 0, false);
         ctx.stroke();
         ctx.beginPath();
         ctx.arc(3.5, -9, 1.5, Math.PI, 0, false);
         ctx.stroke();
      } else if (currentState.caruState === 'SCARED' || currentState.caruState === 'ANXIOUS') {
         // Big round shocked white eyes + black pupils
         ctx.fillStyle = '#ffffff';
         ctx.beginPath(); ctx.arc(-3, -9.5, 3, 0, Math.PI * 2); ctx.fill();
         ctx.beginPath(); ctx.arc(3, -9.5, 3, 0, Math.PI * 2); ctx.fill();
         
         ctx.fillStyle = '#212121';
         ctx.beginPath(); ctx.arc(-3, -9.5, 1.2, 0, Math.PI * 2); ctx.fill();
         ctx.beginPath(); ctx.arc(3, -9.5, 1.2, 0, Math.PI * 2); ctx.fill();
      } else if (currentState.caruState === 'EXCITED') {
         // Squinting excited eyes (>_<)
         ctx.strokeStyle = '#202124';
         ctx.lineWidth = 1.8;
         ctx.beginPath();
         ctx.moveTo(-5, -11); ctx.lineTo(-2, -9); ctx.lineTo(-5, -7);
         ctx.moveTo(5, -11); ctx.lineTo(2, -9); ctx.lineTo(5, -7);
         ctx.stroke();
      } else {
         // Cute happy eyes with beautiful tiny catchlights
         ctx.beginPath(); ctx.arc(-3, -9.5, 2, 0, Math.PI * 2); ctx.fill();
         ctx.beginPath(); ctx.arc(3, -9.5, 2, 0, Math.PI * 2); ctx.fill();
         
         ctx.fillStyle = '#ffffff'; 
         ctx.beginPath(); ctx.arc(-3.5, -10.5, 0.7, 0, Math.PI * 2); ctx.fill();
         ctx.beginPath(); ctx.arc(2.5, -10.5, 0.7, 0, Math.PI * 2); ctx.fill();
      }

      // Blush cheeks 
      ctx.fillStyle = 'rgba(234, 67, 53, 0.35)';
      ctx.beginPath();
      ctx.arc(-5.5, -6.5, 1.5, 0, Math.PI * 2);
      ctx.arc(5.5, -6.5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cute whiskers and bunny/cat nose details
      ctx.fillStyle = '#ff80ab'; // pink nose
      ctx.beginPath();
      ctx.arc(0, -7.2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#202124';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      // Left side whiskers
      ctx.moveTo(-2, -7.2); ctx.lineTo(-6.5, -8.2);
      ctx.moveTo(-2, -7.2); ctx.lineTo(-7.2, -7.0);
      // Right side whiskers
      ctx.moveTo(2, -7.2); ctx.lineTo(6.5, -8.2);
      ctx.moveTo(2, -7.2); ctx.lineTo(7.2, -7.0);
      ctx.stroke();

      // Mouth matching emote state
      ctx.fillStyle = '#202124';
      if (currentState.caruState === 'SCARED' || currentState.caruState === 'EXCITED') {
         ctx.fillStyle = '#ea4335';
         ctx.beginPath();
         ctx.arc(0, -5.5, 2.5, 0, Math.PI, false);
         ctx.closePath();
         ctx.fill();
      } else if (currentState.caruState === 'ANXIOUS') {
         ctx.strokeStyle = '#202124';
         ctx.lineWidth = 1;
         ctx.beginPath();
         ctx.moveTo(-2, -5.5);
         ctx.lineTo(-0.5, -6);
         ctx.lineTo(1, -5);
         ctx.lineTo(2.5, -5.5);
         ctx.stroke();
      } else {
         ctx.strokeStyle = '#202124';
         ctx.lineWidth = 1.2;
         ctx.beginPath();
         ctx.arc(0, -6.5, 2, 0.1, Math.PI - 0.1);
         ctx.stroke();
      }

      ctx.restore(); // Restore Caru bouncing translation

      // 7. Rugged Rolling Tires (Spinning speed synchronized with physical x-distance)
      const wheelRadius = 10;
      const wheelRotation = car.x / wheelRadius; 
      
      const drawWheel = (wx: number, wy: number) => {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(wheelRotation);
        
        // Solid black outer treads
        ctx.fillStyle = '#1a1b1c'; 
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius + 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2d2e30';
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rigid rugged tyre tread lines
        ctx.strokeStyle = '#1e1f20';
        ctx.lineWidth = 2.5;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (wheelRadius - 1), Math.sin(a) * (wheelRadius - 1));
          ctx.lineTo(Math.cos(a) * (wheelRadius + 2.5), Math.sin(a) * (wheelRadius + 2.5));
          ctx.stroke();
        }

        // Cyber neon center-cap rim
        ctx.strokeStyle = isUp ? '#81c995' : '#F28B82';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner wheel spokes rotating
        ctx.strokeStyle = '#dadce0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        }
        ctx.stroke();

        ctx.fillStyle = '#202124';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      };

      drawWheel(-15, 6);
      drawWheel(12, 6);

      // 7.5 Glowing Antenna flag / Banner on rear of jeep (Branding Consistency)
      ctx.strokeStyle = '#9aa0a6';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-24, -16);
      ctx.lineTo(-24, -42);
      ctx.stroke();

      // Flag shape flutters based on time and car speed!
      const flagFlutter = Math.sin(time / 60 - car.x * 0.1) * 3;
      ctx.fillStyle = isUp ? '#34a853' : '#ea4335';
      ctx.beginPath();
      ctx.moveTo(-24, -42);
      ctx.lineTo(-6, -37 + flagFlutter);
      ctx.lineTo(-24, -31);
      ctx.closePath();
      ctx.fill();

      // Border for flag
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Inside flag: Selected Currency symbol (USD, IDR, JPY etc)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 7.5px "Space Grotesk", "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const curSymbol = store.currencyPair.split('/')[1] || '$';
      ctx.fillText(curSymbol, -17, -37 + flagFlutter * 0.5);

      // 8. Custom active turbo exhaust booster flame
      if (c.right && car.fuel > 0) {
         ctx.fillStyle = '#fbbc04'; 
         ctx.beginPath();
         ctx.arc(-28, 5, 4.5 + Math.random() * 4, 0, Math.PI * 2);
         ctx.fill();
         ctx.fillStyle = '#ea4335'; 
         ctx.beginPath();
         ctx.arc(-32, 5, 2.5 + Math.random() * 3, 0, Math.PI * 2);
         ctx.fill();
      }

      ctx.restore(); // Restore car physics translation and rotation

      // 8.5 Fully Animated Dialogue Bubble for cute Caru (unrotated, horizontally steady!)
      const bubbleDial = dialogueTipRef.current;
      const bubbleBob = Math.sin(time / 140) * (Math.min(6, Math.abs(car.speed) * 0.02) + (car.isGrounded ? 0 : 2)) * 0.65;
      
      if (bubbleDial.opacity > 0 && bubbleDial.text) {
         ctx.save();
         // Translate to above the car (adjust for driver's head and the bobbing offset)
         ctx.translate(car.x, car.y - 40 + bubbleBob + bubbleDial.springY);
         ctx.globalAlpha = bubbleDial.opacity;
         
         ctx.font = 'bold 10px "Inter", "Space Grotesk", sans-serif';
         const lines = getWrappedLines(ctx, bubbleDial.text, 195);
         
         // Sizing calculations
         const lineHeight = 14;
         const paddingV = 10;
         const paddingH = 12;
         const titleHeight = 14; // "🦊 Caru FinTips" / "🦊 Caru's FinTips"
         
         let maxLineWidth = 100;
         lines.forEach(l => {
            const w = ctx.measureText(l).width;
            if (w > maxLineWidth) maxLineWidth = w;
         });
         
         const bubbleW = maxLineWidth + paddingH * 2;
         const bubbleH = lines.length * lineHeight + paddingV * 2 + titleHeight;
         
         // Setup Shadow for premium layout depth
         ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
         ctx.shadowBlur = 12;
         ctx.shadowOffsetY = 4;
         
         // Draw speech bubble background
         ctx.fillStyle = '#1e1f22';
         ctx.strokeStyle = isUp ? '#81c995' : '#8ab4f8'; // Color accent based on dynamic price up/down!
         ctx.lineWidth = 2.2;
         
         ctx.beginPath();
         // Rounded rectangle pointing up
         ctx.roundRect(-bubbleW / 2, -bubbleH - 12, bubbleW, bubbleH, 10);
         ctx.fill();
         ctx.shadowBlur = 0; // turn off shadow for texts
         ctx.shadowOffsetY = 0;
         ctx.stroke();
         
         // Draw triangular pointer pointing down to Caru's head
         ctx.fillStyle = '#1e1f22';
         ctx.beginPath();
         ctx.moveTo(-6, -12);
         ctx.lineTo(6, -12);
         ctx.lineTo(0, -4);
         ctx.closePath();
         ctx.fill();
         
         // Stroke for pointer
         ctx.strokeStyle = isUp ? '#81c995' : '#8ab4f8';
         ctx.beginPath();
         ctx.moveTo(-6, -11);
         ctx.lineTo(0, -4);
         ctx.lineTo(6, -11);
         ctx.stroke();
         
         // Draw header: label/title
         ctx.fillStyle = '#fcd34d'; // bright warm cute yellow for speaker
         ctx.textBaseline = 'top';
         ctx.textAlign = 'left';
         ctx.font = 'bold 10px "Space Grotesk", sans-serif';
         const headerText = store.currencyPair.includes('IDR') ? '🦊 Tips Finansial:' : '🦊 Caru\'s FinTips:';
         ctx.fillText(headerText, -bubbleW / 2 + paddingH, -bubbleH - 12 + paddingV);
         
         // Draw lines of text
         ctx.fillStyle = '#f8f9fa';
         ctx.font = '500 10.5px "Inter", sans-serif';
         lines.forEach((line, idx) => {
            ctx.fillText(line, -bubbleW / 2 + paddingH, -bubbleH - 12 + paddingV + titleHeight + idx * lineHeight);
         });
         
         ctx.restore();
      }

      // Reset Matrix
      ctx.restore();

      // ── Y-axis price labels (use precomputed range — no more O(n) per frame!) ──
      ctx.fillStyle = '#9aa0a6';
      ctx.font = '12px "Google Sans", sans-serif';
      ctx.textAlign = 'right';
      const { max: globalMax, range: globalRange } = globalPriceRangeRef.current;
      for (let y = minP; y <= maxP; y += gridSpacingY) {
        const normalizedY = (y - height * 0.1) / (height * 0.8);
        const valPrice = globalMax - normalizedY * globalRange;
        ctx.fillText(valPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }), 50, y - cameraRef.current.y - 5);
      }

      // ── Progress bar (bottom of screen) ──
      const totalTrackPx = pointsRef.current.length > 0 ? pointsRef.current[pointsRef.current.length - 1].x : 1;
      const carProgress = Math.min(1, Math.max(0, car.x / totalTrackPx));
      const barW = width - 32;
      const barH = 4;
      const barX = 16;
      const barY = height - 14;
      ctx.fillStyle = '#3c4043';
      ctx.beginPath();
      (ctx as any).roundRect(barX, barY, barW, barH, 2);
      ctx.fill();
      const progressGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      progressGrad.addColorStop(0, '#4285f4');
      progressGrad.addColorStop(0.5, '#34a853');
      progressGrad.addColorStop(1, '#fbbc04');
      ctx.fillStyle = progressGrad;
      ctx.beginPath();
      (ctx as any).roundRect(barX, barY, barW * carProgress, barH, 2);
      ctx.fill();
      // Car indicator dot on progress bar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(barX + barW * carProgress, barY + barH / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // ── Crisis zone incoming warning banner ──
      if (crisisAlertTimerRef.current > 0 && activeCrisisRef.current) {
        const alpha = Math.min(1, crisisAlertTimerRef.current / 500);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bannerY = height / 2 - 60;
        ctx.fillStyle = activeCrisisRef.current.severity === 'EXTREME' ? 'rgba(234,67,53,0.9)'
          : activeCrisisRef.current.severity === 'SEVERE' ? 'rgba(242,153,0,0.9)' : 'rgba(52,168,83,0.9)';
        const bW = 340, bH = 54;
        ctx.beginPath();
        (ctx as any).roundRect((width - bW) / 2, bannerY, bW, bH, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Google Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(activeCrisisRef.current.label, width / 2, bannerY + 22);
        ctx.font = '12px "Google Sans", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(activeCrisisRef.current.description.replace('\n', ' — '), width / 2, bannerY + 40);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [store.currencyPair, store.timeRange, store.isCrashed]);

  // Handle custom touch control events from HUD
  useEffect(() => {
    const handleGameControl = (e: any) => {
      const { control, active } = e.detail;
      if (control === 'left') {
        controlsRef.current.left = active;
        if (!active) controlsRef.current.up = false;
      }
      if (control === 'right') {
        controlsRef.current.right = active;
        if (!active) controlsRef.current.up = false;
      }
      if (control === 'jump') {
        controlsRef.current.up = active;
      }
    };
    window.addEventListener('game-control', handleGameControl);
    return () => window.removeEventListener('game-control', handleGameControl);
  }, []);

  // Handle activeAlert auto timeout
  useEffect(() => {
    if (activeAlert) {
      const t = setTimeout(() => {
        setActiveAlert(null);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [activeAlert]);


  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0F0F0F] touch-none overflow-hidden select-none">
      {dataLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#202124]">
            <div className="w-8 h-8 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9aa0a6] text-sm animate-pulse">Memuat Data Historis...</p>
        </div>
      )}

      {/* Floating active game alerts */}
      {activeAlert && (
         <div 
           key={activeAlert.id} 
           className={`absolute top-24 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-full border shadow-2xl z-40 animate-bounce pointer-events-none text-xs md:text-sm font-bold flex items-center gap-2 backdrop-blur-md transition-all duration-300 ${
             activeAlert.type === 'GOOD' 
               ? 'bg-[#e6f4ea]/95 text-[#137333] border-[#81c995]' 
               : 'bg-[#fce8e6]/95 text-[#c5221f] border-[#f28b82]'
           }`}
         >
           {activeAlert.text}
         </div>
      )}
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
