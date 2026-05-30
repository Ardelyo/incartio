import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface DataPoint {
  time: number;
  price: number;
}

const PORT = Number(process.env.PORT || 3001);
const ALLOWED_PAIRS = new Set(['USD/IDR', 'EUR/USD', 'GBP/JPY', 'USD/JPY', 'BTC/USD', 'AUD/USD']);
const ALLOWED_PROVIDERS = new Set(['DEFAULT', 'ALPHAVANTAGE', 'FOREXRATEAPI']);
const CACHE_TTL_MS = 60_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const app = express();
const cache = new Map<string, { expiresAt: number; value: unknown }>();
const rateBuckets = new Map<string, { resetAt: number; count: number }>();

function securityHeaders(_req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  );
  next();
}

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.ip || 'local';
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { resetAt: now + RATE_LIMIT_WINDOW_MS, count: 1 });
    next();
    return;
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  next();
}

function isAllowedPair(pair: unknown): pair is string {
  return typeof pair === 'string' && ALLOWED_PAIRS.has(pair);
}

function normalizeProvider(provider: unknown) {
  const candidate = typeof provider === 'string' ? provider.toUpperCase() : 'DEFAULT';
  return ALLOWED_PROVIDERS.has(candidate) ? candidate : 'DEFAULT';
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached(key: string, value: unknown) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchJson(url: string, timeoutMs = 3_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFreeLatest(base: string, target: string): Promise<number | null> {
  const apiVersion = 'v1';
  const endpoint = `currencies/${base.toLowerCase()}.json`;
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/${apiVersion}/${endpoint}`,
    `https://latest.currency-api.pages.dev/${apiVersion}/${endpoint}`,
  ];

  for (const url of urls) {
    const data = await fetchJson(url);
    const price = data?.[base.toLowerCase()]?.[target.toLowerCase()];
    if (typeof price === 'number') return price;
  }

  return null;
}

async function fetchProviderLatest(base: string, target: string, provider: string): Promise<number | null> {
  if (provider === 'ALPHAVANTAGE' && process.env.ALPHA_VANTAGE_KEY) {
    const params = new URLSearchParams({
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: base,
      to_currency: target,
      apikey: process.env.ALPHA_VANTAGE_KEY,
    });
    const data = await fetchJson(`https://www.alphavantage.co/query?${params.toString()}`);
    const value = data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
    return value ? Number(value) : null;
  }

  if (provider === 'FOREXRATEAPI' && process.env.FOREX_API_KEY) {
    const params = new URLSearchParams({
      api_key: process.env.FOREX_API_KEY,
      base,
      currencies: target,
    });
    const data = await fetchJson(`https://api.forexrateapi.com/v1/latest?${params.toString()}`);
    const value = data?.rates?.[target];
    return typeof value === 'number' ? value : null;
  }

  return null;
}

async function fetchAlphaHistorical(base: string, target: string, days: number): Promise<DataPoint[]> {
  if (!process.env.ALPHA_VANTAGE_KEY) return [];

  const params = new URLSearchParams({
    function: 'FX_DAILY',
    from_symbol: base,
    to_symbol: target,
    apikey: process.env.ALPHA_VANTAGE_KEY,
  });
  const data = await fetchJson(`https://www.alphavantage.co/query?${params.toString()}`, 5_000);
  const series = data?.['Time Series FX (Daily)'];
  if (!series) return [];

  return Object.keys(series)
    .slice(0, days)
    .map((date) => ({
      time: new Date(date).getTime(),
      price: Number(series[date]?.['4. close']),
    }))
    .filter((point) => Number.isFinite(point.price))
    .reverse();
}

async function fetchFreeHistorical(base: string, target: string, days: number): Promise<DataPoint[]> {
  const step = Math.max(2, Math.floor(days / 5));
  const dates: string[] = [];

  for (let i = days - 1; i >= 1; i -= step) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  dates.push('latest');

  const apiVersion = 'v1';
  const endpoint = `currencies/${base.toLowerCase()}.json`;

  const points = await Promise.all(
    dates.map(async (date) => {
      const urls = [
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/${apiVersion}/${endpoint}`,
        `https://${date}.currency-api.pages.dev/${apiVersion}/${endpoint}`,
      ];

      for (const url of urls) {
        const data = await fetchJson(url, 1_500);
        const price = data?.[base.toLowerCase()]?.[target.toLowerCase()];
        if (typeof price === 'number') {
          return {
            time: date === 'latest' ? Date.now() : new Date(date).getTime(),
            price,
          };
        }
      }

      return null;
    })
  );

  return points.filter((point): point is DataPoint => point !== null);
}

app.disable('x-powered-by');
app.use(securityHeaders);
app.use('/api', rateLimit);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'FINCARS market data proxy' });
});

app.get('/api/price', async (req, res) => {
  const pair = req.query.pair;
  if (!isAllowedPair(pair)) {
    res.status(400).json({ error: 'Invalid currency pair' });
    return;
  }

  const provider = normalizeProvider(req.query.provider);
  const cacheKey = `price:${pair}:${provider}`;
  const cached = getCached<{ price: number }>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const [base, target] = pair.split('/');

  try {
    const price = (await fetchProviderLatest(base, target, provider)) ?? (await fetchFreeLatest(base, target));
    if (typeof price !== 'number' || !Number.isFinite(price)) {
      res.status(502).json({ error: 'Market data unavailable' });
      return;
    }

    const payload = { price };
    setCached(cacheKey, payload);
    res.json(payload);
  } catch {
    res.status(502).json({ error: 'Market data unavailable' });
  }
});

app.get('/api/history', async (req, res) => {
  const pair = req.query.pair;
  if (!isAllowedPair(pair)) {
    res.status(400).json({ error: 'Invalid currency pair' });
    return;
  }

  const provider = normalizeProvider(req.query.provider);
  const days = Math.min(Math.max(Number(req.query.days) || 5, 1), 365);
  const cacheKey = `history:${pair}:${provider}:${days}`;
  const cached = getCached<{ points: DataPoint[] }>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const [base, target] = pair.split('/');

  try {
    const points =
      provider === 'ALPHAVANTAGE'
        ? (await fetchAlphaHistorical(base, target, days)) || []
        : [];
    const finalPoints = points.length ? points : await fetchFreeHistorical(base, target, days);

    const payload = { points: finalPoints };
    setCached(cacheKey, payload);
    res.json(payload);
  } catch {
    res.status(502).json({ error: 'Market history unavailable' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FINCARS API proxy running on port ${PORT}`);
});
