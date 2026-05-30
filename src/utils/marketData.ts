// Market data simulator for generating terrain

export interface DataPoint {
  time: number;
  price: number;
}

export interface PairProfile {
  pair: string;
  basePrice: number;
  volatility: number; // 0.0 to 1.0
  color: string;
  theme: string;
}

export const PAIR_PROFILES: Record<string, PairProfile> = {
  'USD/IDR': { pair: 'USD/IDR', basePrice: 16000, volatility: 0.4, color: '#10B981', theme: 'Pulau Tropis' },
  'EUR/USD': { pair: 'EUR/USD', basePrice: 1.08, volatility: 0.15, color: '#3B82F6', theme: 'Batu Kota Eropa' },
  'GBP/JPY': { pair: 'GBP/JPY', basePrice: 191.50, volatility: 0.6, color: '#F59E0B', theme: 'Dataran Berkabut' },
  'USD/JPY': { pair: 'USD/JPY', basePrice: 155.20, volatility: 0.35, color: '#EAB308', theme: 'Kota Neon' },
  'BTC/USD': { pair: 'BTC/USD', basePrice: 65000, volatility: 0.9, color: '#8B5CF6', theme: 'Ruang Gelap' },
  'AUD/USD': { pair: 'AUD/USD', basePrice: 0.66, volatility: 0.25, color: '#F97316', theme: 'Gurun Outback' },
};

export function isSupportedPair(pair: string): boolean {
  return Object.prototype.hasOwnProperty.call(PAIR_PROFILES, pair);
}

export async function fetchLivePrice(pair: string, provider: string = 'DEFAULT'): Promise<number | null> {
  if (!isSupportedPair(pair)) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(
      `/api/price?pair=${encodeURIComponent(pair)}&provider=${encodeURIComponent(provider)}`,
      { signal: controller.signal }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.price === 'number' ? data.price : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchHistoricalDataPoints(pair: string, days: number, provider: string = 'DEFAULT'): Promise<DataPoint[]> {
  if (!isSupportedPair(pair)) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `/api/history?pair=${encodeURIComponent(pair)}&days=${encodeURIComponent(String(days))}&provider=${encodeURIComponent(provider)}`,
      { signal: controller.signal }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.points) ? data.points : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates mock-historical decade-wide pivot points for the "MAX" range.
 * This represents actual real macro milestones going back 25+ years (f.e., 1997 IDR crisis)
 */
export function generateMaxHistoricalData(pair: string): DataPoint[] {
  const pivotPoints: Record<string, { year: number, price: number }[]> = {
    'USD/IDR': [
      { year: 1997, price: 2500 },
      { year: 1998, price: 15000 },
      { year: 2003, price: 8500 },
      { year: 2011, price: 9000 },
      { year: 2015, price: 13500 },
      { year: 2020, price: 16500 },
      { year: 2023, price: 14700 },
      { year: 2026, price: 16200 }
    ],
    'EUR/USD': [
      { year: 2000, price: 0.85 },
      { year: 2002, price: 1.00 },
      { year: 2008, price: 1.60 },
      { year: 2012, price: 1.25 },
      { year: 2015, price: 1.05 },
      { year: 2018, price: 1.24 },
      { year: 2021, price: 1.22 },
      { year: 2026, price: 1.08 }
    ],
    'BTC/USD': [
      { year: 2010, price: 0.10 },
      { year: 2013, price: 1000 },
      { year: 2015, price: 220 },
      { year: 2017, price: 19800 },
      { year: 2018, price: 3200 },
      { year: 2021, price: 69000 },
      { year: 2022, price: 15500 },
      { year: 2026, price: 65000 }
    ],
    'GBP/JPY': [
      { year: 1998, price: 240 },
      { year: 2000, price: 150 },
      { year: 2007, price: 250 },
      { year: 2011, price: 120 },
      { year: 2015, price: 195 },
      { year: 2020, price: 130 },
      { year: 2024, price: 200 },
      { year: 2026, price: 191.50 }
    ],
    'USD/JPY': [
      { year: 1998, price: 147 },
      { year: 2000, price: 102 },
      { year: 2007, price: 124 },
      { year: 2011, price: 75 },
      { year: 2015, price: 125 },
      { year: 2020, price: 103 },
      { year: 2024, price: 160 },
      { year: 2026, price: 155.20 }
    ],
    'AUD/USD': [
      { year: 1998, price: 0.60 },
      { year: 2001, price: 0.48 },
      { year: 2008, price: 0.98 },
      { year: 2011, price: 1.10 },
      { year: 2015, price: 0.70 },
      { year: 2020, price: 0.57 },
      { year: 2024, price: 0.68 },
      { year: 2026, price: 0.66 }
    ]
  };

  const pivots = pivotPoints[pair] || pivotPoints['USD/IDR'];
  const res: DataPoint[] = [];
  
  for (let i = 0; i < pivots.length; i++) {
     const p = pivots[i];
     const time = new Date(`${p.year}-06-01`).getTime();
     res.push({ time, price: p.price });
  }
  return res;
}

/**
 * Generates historical terrain data representing price over time.
 * If livePrice is provided, the data will anchor its latest point to it.
 * Overloaded now to interpolate real historical day data into a longer track.
 */
export function generateTerrainData(pair: string, length: number, realData: DataPoint[]): DataPoint[] {
  const profile = PAIR_PROFILES[pair] || PAIR_PROFILES['USD/IDR'];
  
  if (!realData || realData.length < 2) {
      // Fallback if API fails or times out - extremely robust and realistic, strictly bounded
      const fallbackPoints = [];
      let base = profile.basePrice;
      let trend = (Math.random() - 0.5);
      
      const maxDeviationPercentage = profile.volatility * 0.04; // Max 4% volatility range for USD/IDR, e.g. 15300 to 16700
      
      for (let i = 0; i < length; i++) {
         fallbackPoints.push({ time: Date.now() - (length - i) * 60000, price: base });
         
         const randomShift = (Math.random() - 0.5) * 2;
         trend = trend * 0.85 + randomShift * 0.15;
         
         const deviationPercentage = (base - profile.basePrice) / profile.basePrice;
         const meanReversion = -deviationPercentage * 0.4; // Strong pull back
         
         const change = base * (profile.volatility * 0.001) * trend + (base * meanReversion);
         base += change;
         
         // Hard boundary clamps
         const maxAllowedPrice = profile.basePrice * (1 + maxDeviationPercentage);
         const minAllowedPrice = profile.basePrice * (1 - maxDeviationPercentage);
         if (base > maxAllowedPrice) base = maxAllowedPrice;
         if (base < minAllowedPrice) base = minAllowedPrice;
      }
      return fallbackPoints;
  }

  // We have e.g. 5-6 real daily points, we want to expand this to `length` points (e.g. 250)
  // by linearly interpolating and adding very minor intraday noise.
  const expanded: DataPoint[] = [];
  const pointsPerSegment = Math.floor(length / (realData.length - 1));
  
  for (let i = 0; i < realData.length - 1; i++) {
      const start = realData[i];
      const end = realData[i+1];
      
      for (let j = 0; j < pointsPerSegment; j++) {
         const t = j / pointsPerSegment;
         // Linear interpolation
         const interpPrice = start.price + (end.price - start.price) * t;
         const interpTime = start.time + (end.time - start.time) * t;
         
         // Add tiny procedural noise (intraday)
         // Max intraday noise is very small fraction of the price (e.g. 0.05%)
         const noise = interpPrice * (t === 0 ? 0 : (Math.random() - 0.5) * 0.0004);
         
         expanded.push({
             time: interpTime,
             price: interpPrice + noise
         });
      }
  }
  
  // Fill any remaining points with noisy continuation (NOT flat duplicates!)
  const remaining = length - expanded.length;
  if (remaining > 0) {
    let lastPrice = expanded[expanded.length - 1]?.price ?? realData[realData.length - 1].price;
    const lastTime = expanded[expanded.length - 1]?.time ?? realData[realData.length - 1].time;
    const timeStep = (realData[realData.length - 1].time - realData[0].time) / length;
    for (let i = 0; i < remaining; i++) {
      const noise = lastPrice * (Math.random() - 0.5) * (profile.volatility * 0.03);
      lastPrice = lastPrice + noise;
      expanded.push({ time: lastTime + timeStep * (i + 1), price: lastPrice });
    }
  }

  return expanded;
}

export function generateNextTick(pair: string, currentPrice: number): DataPoint {
  const profile = PAIR_PROFILES[pair] || PAIR_PROFILES['USD/IDR'];
  const volatility = profile.volatility;
  
  // Random micro-movement, strictly bounded to not run away
  const shift = (Math.random() - 0.5) * 2;
  // Live tick noise for gameplay needs to be large enough to see on canvas
  const change = currentPrice * (volatility * 0.02) * shift;
  
  return {
    time: Date.now(),
    price: currentPrice + change
  };
}

// ─── Crisis Zone Definitions ──────────────────────────────────────────────────
// Each entry maps to a track index range (out of 250 base points).
// "priceJump" is the expected price ratio change (for validation).
export interface CrisisZone {
  label: string;
  description: string;
  startIdx: number;  // track point index (0-250)
  endIdx: number;
  severity: 'MODERATE' | 'SEVERE' | 'EXTREME';
  year: number;
}

const CRISIS_ZONES: Record<string, CrisisZone[]> = {
  'USD/IDR': [
    { label: '🌊 Krisis Finansial Asia', description: 'Rupiah turun 80%\ndalam 6 bulan — 1997', startIdx: 5, endIdx: 25, severity: 'EXTREME', year: 1997 },
    { label: '📉 Kejatuhan COVID', description: 'Pandemi global\nguncang pasar — 2020', startIdx: 155, endIdx: 175, severity: 'SEVERE', year: 2020 },
    { label: '⚡ Pemulihan Pasca-COVID', description: 'Kenaikan suku bunga Fed\nmengangkat DXY — 2022', startIdx: 185, endIdx: 205, severity: 'MODERATE', year: 2022 },
  ],
  'BTC/USD': [
    { label: '🐂 Bull Run Pertama', description: 'BTC naik ke $1,000\npertama kali — 2013', startIdx: 18, endIdx: 30, severity: 'MODERATE', year: 2013 },
    { label: '🔥 Mania Gelembung', description: 'Puncak $19,800 — lalu\njatuh 84% — 2017', startIdx: 85, endIdx: 110, severity: 'EXTREME', year: 2017 },
    { label: '🚀 Rekor Tertinggi', description: 'BTC capai $69,000\npuncak siklus — 2021', startIdx: 140, endIdx: 165, severity: 'EXTREME', year: 2021 },
    { label: '🧊 Musim Dingin Kripto', description: 'FTX runtuh,\ndasar $15k — 2022', startIdx: 170, endIdx: 200, severity: 'SEVERE', year: 2022 },
  ],
  'EUR/USD': [
    { label: '🏦 Krisis Utang Euro', description: 'Yunani, Italia, Spanyol:\nbailout IMF — 2012', startIdx: 70, endIdx: 90, severity: 'SEVERE', year: 2012 },
    { label: '🗳️ Guncangan Brexit', description: 'UK memilih keluar —\nGBP/EUR terguncang — 2016', startIdx: 115, endIdx: 130, severity: 'MODERATE', year: 2016 },
    { label: '📉 Titik Rendah COVID', description: 'USD menguat sebagai\naset aman — 2020', startIdx: 155, endIdx: 170, severity: 'MODERATE', year: 2020 },
  ],
  'USD/JPY': [
    { label: '🗻 Krisis JPY 1998', description: 'Yen menguat ke 147\ncarry trade terurai', startIdx: 5, endIdx: 20, severity: 'SEVERE', year: 1998 },
    { label: '🌊 Titik Dekade Hilang', description: 'JPY terkuat di 75\nusai gempa 2011', startIdx: 70, endIdx: 90, severity: 'EXTREME', year: 2011 },
    { label: '⚡ Ledakan Carry Trade', description: 'Kenaikan BOJ memicu\nsqueeze JPY besar — 2024', startIdx: 205, endIdx: 230, severity: 'SEVERE', year: 2024 },
  ],
  'GBP/JPY': [
    { label: '💔 Tebing Brexit', description: 'GBP/JPY jatuh dari 148\nke 130 semalam — 2016', startIdx: 100, endIdx: 125, severity: 'EXTREME', year: 2016 },
    { label: '🌊 Kejut COVID', description: 'Risk-off dorong JPY —\nGBP/JPY jatuh — 2020', startIdx: 152, endIdx: 168, severity: 'SEVERE', year: 2020 },
  ],
  'AUD/USD': [
    { label: '⛏️ Puncak Boom Tambang', description: 'AUD > USD pertama kali\ndalam dekade — 2011', startIdx: 72, endIdx: 92, severity: 'MODERATE', year: 2011 },
    { label: '🌊 Titik Rendah COVID', description: 'Permintaan komoditas jatuh\nmenekan Aussie — 2020', startIdx: 152, endIdx: 168, severity: 'SEVERE', year: 2020 },
  ],
};

type CrisisTimeRange = 'LIVE' | '1D' | '5D' | '1M' | '1Y' | 'MAX';

function getRangeWindowMs(timeRange: CrisisTimeRange): number | null {
  switch (timeRange) {
    case 'MAX':
      return null;
    case '1Y':
      return 366 * 24 * 60 * 60 * 1000;
    case '1M':
      return 31 * 24 * 60 * 60 * 1000;
    case '5D':
      return 5 * 24 * 60 * 60 * 1000;
    case '1D':
    case 'LIVE':
      return 24 * 60 * 60 * 1000;
  }
}

function crisisAnchorDate(zone: CrisisZone): number {
  return new Date(Date.UTC(zone.year, 5, 1)).getTime();
}

export function getCrisisZones(pair: string, timeRange: CrisisTimeRange = 'MAX', now: number = Date.now()): CrisisZone[] {
  const zones = CRISIS_ZONES[pair] || [];
  const windowMs = getRangeWindowMs(timeRange);

  if (windowMs === null) return zones;

  const rangeStart = now - windowMs;
  return zones.filter((zone) => {
    const eventTime = crisisAnchorDate(zone);
    return eventTime >= rangeStart && eventTime <= now;
  });
}
