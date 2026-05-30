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
  'USD/IDR': { pair: 'USD/IDR', basePrice: 16000, volatility: 0.4, color: '#10B981', theme: 'Tropical Island' },
  'EUR/USD': { pair: 'EUR/USD', basePrice: 1.08, volatility: 0.15, color: '#3B82F6', theme: 'European Cobblestone' },
  'GBP/JPY': { pair: 'GBP/JPY', basePrice: 191.50, volatility: 0.6, color: '#F59E0B', theme: 'Foggy Highlands' },
  'USD/JPY': { pair: 'USD/JPY', basePrice: 155.20, volatility: 0.35, color: '#EAB308', theme: 'Neon City' },
  'BTC/USD': { pair: 'BTC/USD', basePrice: 65000, volatility: 0.9, color: '#8B5CF6', theme: 'Dark Space' },
  'AUD/USD': { pair: 'AUD/USD', basePrice: 0.66, volatility: 0.25, color: '#F97316', theme: 'Outback Desert' },
};

export async function fetchLivePrice(pair: string, provider: string = 'DEFAULT', apiKey: string = ''): Promise<number | null> {
  const [base, target] = pair.split('/');
  if (!base || !target) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    if (provider === 'ALPHAVANTAGE' && apiKey) {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${target}&apikey=${apiKey}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      clearTimeout(timeoutId);
      if (data['Realtime Currency Exchange Rate']) {
        return parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
      }
      return null;
    }

    if (provider === 'FOREXRATEAPI' && apiKey) {
      const url = `https://api.forexrateapi.com/v1/latest?api_key=${apiKey}&base=${base}&currencies=${target}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      clearTimeout(timeoutId);
      if (data.success && data.rates[target]) {
        return data.rates[target];
      }
      return null;
    }

    // Default Free Fallback (fawazahmed0)
    const date = 'latest';
    const apiVersion = 'v1';
    const endpoint = `currencies/${base.toLowerCase()}.json`;
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/${apiVersion}/${endpoint}`,
      `https://${date}.currency-api.pages.dev/${apiVersion}/${endpoint}`
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          const price = data[base.toLowerCase()][target.toLowerCase()];
          if (price !== undefined) {
             clearTimeout(timeoutId);
             return price;
          }
        }
      } catch (e) {
        // try next
      }
    }
  } catch (e) {
    console.warn(`API Fetch failed for ${provider}`, e);
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

export async function fetchHistoricalDataPoints(pair: string, days: number, provider: string = 'DEFAULT', apiKey: string = ''): Promise<DataPoint[]> {
  const [base, target] = pair.split('/');
  if (!base || !target) return [];

  // If Alpha Vantage is used for historical, we could use FX_DAILY
  if (provider === 'ALPHAVANTAGE' && apiKey) {
     try {
       const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${base}&to_symbol=${target}&apikey=${apiKey}`;
       const res = await fetch(url);
       const data = await res.json();
       if (data['Time Series FX (Daily)']) {
         const series = data['Time Series FX (Daily)'];
         const dates = Object.keys(series).slice(0, days);
         const points: DataPoint[] = dates.map(d => ({
           time: new Date(d).getTime(),
           price: parseFloat(series[d]['4. close'])
         }));
         return points.reverse();
       }
     } catch (e) {
       console.warn("AlphaVantage historical failed", e);
     }
  }

  // Fallback to the original free API
  const step = Math.max(2, Math.floor(days / 5));
  const dates: string[] = [];
  for (let i = days - 1; i >= 1; i -= step) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  dates.push('latest');

  const apiVersion = 'v1';
  const endpoint = `currencies/${base.toLowerCase()}.json`;

  const fetchDate = async (dateStr: string) => {
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/${apiVersion}/${endpoint}`,
      `https://${dateStr}.currency-api.pages.dev/${apiVersion}/${endpoint}`
    ];
    for (const url of urls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); 
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          const price = data[base.toLowerCase()][target.toLowerCase()];
          if (price !== undefined) {
            return {
              time: dateStr === 'latest' ? Date.now() : new Date(dateStr).getTime(),
              price
            };
          }
        }
      } catch (e) {
         clearTimeout(timeoutId);
      }
    }
    return null;
  };

  const results = await Promise.all(dates.map(date => fetchDate(date)));
  return results.filter((r): r is DataPoint => r !== null);
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
    { label: '🌊 Asian Financial Crisis', description: 'Rupiah turun 80%\ndalam 6 bulan — 1997', startIdx: 5, endIdx: 25, severity: 'EXTREME', year: 1997 },
    { label: '📉 COVID Crash', description: 'Pandemi global\nguncang pasar — 2020', startIdx: 155, endIdx: 175, severity: 'SEVERE', year: 2020 },
    { label: '⚡ Post-COVID Rebound', description: 'Fed rate hike\nnaikkan DXY — 2022', startIdx: 185, endIdx: 205, severity: 'MODERATE', year: 2022 },
  ],
  'BTC/USD': [
    { label: '🐂 First Bull Run', description: 'BTC naik ke $1,000\npertama kali — 2013', startIdx: 18, endIdx: 30, severity: 'MODERATE', year: 2013 },
    { label: '🔥 Bubble Mania', description: '$19,800 peak — lalu\ncrash 84% — 2017', startIdx: 85, endIdx: 110, severity: 'EXTREME', year: 2017 },
    { label: '🚀 All-Time High', description: 'BTC capai $69,000\npuncak siklus — 2021', startIdx: 140, endIdx: 165, severity: 'EXTREME', year: 2021 },
    { label: '🧊 Crypto Winter', description: 'FTX collapse,\n$15k floor — 2022', startIdx: 170, endIdx: 200, severity: 'SEVERE', year: 2022 },
  ],
  'EUR/USD': [
    { label: '🏦 Euro Debt Crisis', description: 'Greece, Italy, Spain:\nIMF bailouts — 2012', startIdx: 70, endIdx: 90, severity: 'SEVERE', year: 2012 },
    { label: '🗳️ Brexit Shock', description: 'UK votes Leave —\nGBP/EUR shock — 2016', startIdx: 115, endIdx: 130, severity: 'MODERATE', year: 2016 },
    { label: '📉 COVID Low', description: 'USD surge as\nsafe haven — 2020', startIdx: 155, endIdx: 170, severity: 'MODERATE', year: 2020 },
  ],
  'USD/JPY': [
    { label: '🗻 1998 JPY Crisis', description: 'Yen strengthens to 147\ncarry trade unwind', startIdx: 5, endIdx: 20, severity: 'SEVERE', year: 1998 },
    { label: '🌊 Lost Decade Low', description: 'JPY strongest at 75\nafter 2011 earthquake', startIdx: 70, endIdx: 90, severity: 'EXTREME', year: 2011 },
    { label: '⚡ Carry Trade Bomb', description: 'BOJ hike triggers\nmassive JPY squeeze — 2024', startIdx: 205, endIdx: 230, severity: 'SEVERE', year: 2024 },
  ],
  'GBP/JPY': [
    { label: '💔 Brexit Cliff', description: 'GBP/JPY plunged from 148\nto 130 overnight — 2016', startIdx: 100, endIdx: 125, severity: 'EXTREME', year: 2016 },
    { label: '🌊 COVID Flash', description: 'Risk-off surge in JPY —\nGBP/JPY crashed — 2020', startIdx: 152, endIdx: 168, severity: 'SEVERE', year: 2020 },
  ],
  'AUD/USD': [
    { label: '⛏️ Mining Boom Peak', description: 'AUD > USD for first time\nin decades — 2011', startIdx: 72, endIdx: 92, severity: 'MODERATE', year: 2011 },
    { label: '🌊 COVID Low', description: 'Commodity demand crash\nhits Aussie — 2020', startIdx: 152, endIdx: 168, severity: 'SEVERE', year: 2020 },
  ],
};

export function getCrisisZones(pair: string): CrisisZone[] {
  return CRISIS_ZONES[pair] || [];
}

