# Security Remediation Guide - Incartion

Quick implementation guide to fix critical security issues.

---

## 1️⃣ Immediate Fix: Secure API Settings Modal

**File to update:** `src/components/ApiSettingsModal.tsx`

Change the API key input from visible text to password field:

```typescript
// BEFORE (Line 65) - VULNERABLE
<input
  type="text"
  value={apiKey}
  onChange={(e) => setApiKey(e.target.value)}
  placeholder="Enter your API Key..."
  className="w-full bg-[#202124] border border-[#3c4043] rounded-lg p-3 text-white focus:outline-none focus:border-[#8ab4f8] transition-colors"
/>

// AFTER - SECURE
<input
  type="password"
  value={apiKey}
  onChange={(e) => setApiKey(e.target.value)}
  placeholder="Enter your API Key..."
  className="w-full bg-[#202124] border border-[#3c4043] rounded-lg p-3 text-white focus:outline-none focus:border-[#8ab4f8] transition-colors"
/>
```

**Why:** Masks API key display, prevents shoulder-surfing.

---

## 2️⃣ Input Validation for Currency Pairs

**File to update:** `src/utils/marketData.ts`

Add validation at the start of both functions:

```typescript
// ADD THIS AT THE TOP OF marketData.ts
function validateCurrencyPair(pair: string): boolean {
  if (!pair || typeof pair !== 'string') return false;
  if (!pair.includes('/')) return false;
  
  // Only allow known pairs from PAIR_PROFILES
  return pair in PAIR_PROFILES;
}

// UPDATE fetchLivePrice function (around line 25)
export async function fetchLivePrice(pair: string, provider: string = 'DEFAULT', apiKey: string = ''): Promise<number | null> {
  // ADD VALIDATION
  if (!validateCurrencyPair(pair)) {
    console.error(`Invalid currency pair: ${pair}`);
    return null;
  }
  
  const [base, target] = pair.split('/');
  if (!base || !target) return null;
  
  // ... rest of function
}

// UPDATE fetchHistoricalDataPoints function (around line 87)
export async function fetchHistoricalDataPoints(pair: string, days: number, provider: string = 'DEFAULT', apiKey: string = ''): Promise<DataPoint[]> {
  // ADD VALIDATION
  if (!validateCurrencyPair(pair)) {
    console.error(`Invalid currency pair: ${pair}`);
    return [];
  }
  
  const [base, target] = pair.split('/');
  if (!base || !target) return [];
  
  // ... rest of function
}
```

**Why:** Prevents injection attacks and unexpected API calls.

---

## 3️⃣ Remove Console Logging of Sensitive Data

**File to update:** `src/utils/marketData.ts`

Replace debug logging:

```typescript
// BEFORE (VULNERABLE - Line 81)
catch (e) {
  console.warn(`API Fetch failed for ${provider}`, e);
}

// AFTER (SAFE)
catch (e) {
  // Silent failure - don't log provider details
  // In production, use error tracking service (Sentry) with PII redaction
}

// BEFORE (VULNERABLE - Line 104)
catch (e) {
  console.warn("AlphaVantage historical failed", e);
}

// AFTER (SAFE)
catch (e) {
  // Silent failure for robustness
}
```

**Why:** Prevents API details from appearing in logs or error tracking systems.

---

## 4️⃣ Create Backend Proxy Server

**Create new file:** `server.ts` (in project root)

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' })); // Restrict in production

// Rate limiting: 30 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many API requests',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Type validation
interface PriceRequest {
  pair?: string;
  provider?: string;
}

// Backend endpoint - API keys stored in .env only
app.get('/api/price/:pair', async (req: Request, res: Response) => {
  try {
    const { pair } = req.params;
    const provider = (req.query.provider as string) || 'DEFAULT';
    
    // Validate pair
    const validPairs = ['USD/IDR', 'EUR/USD', 'GBP/JPY', 'USD/JPY', 'BTC/USD', 'AUD/USD'];
    if (!validPairs.includes(pair)) {
      return res.status(400).json({ error: 'Invalid currency pair' });
    }

    // Get API key from backend environment only
    let apiKey = '';
    if (provider === 'ALPHAVANTAGE') {
      apiKey = process.env.ALPHA_VANTAGE_KEY || '';
    } else if (provider === 'FOREXRATEAPI') {
      apiKey = process.env.FOREX_API_KEY || '';
    }

    const [base, target] = pair.split('/');

    if (provider === 'ALPHAVANTAGE' && apiKey) {
      // Use Authorization header instead of URL parameter
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${target}&apikey=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({ error: 'External API error' });
      }

      const data = await response.json();
      if (data['Realtime Currency Exchange Rate']) {
        const price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
        return res.json({ price, pair, timestamp: Date.now() });
      }
    }

    // Default free API fallback (no auth needed)
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const price = data[base.toLowerCase()][target.toLowerCase()];
      if (price !== undefined) {
        return res.json({ price, pair, timestamp: Date.now() });
      }
    }

    res.status(503).json({ error: 'Service unavailable' });
  } catch (error) {
    // Log error securely without exposing details to client
    console.error('[API Error - Backend Only]');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Secure API proxy running on port ${PORT}`);
});
```

**Create/Update:** `.env` file

```env
# API Keys - NEVER commit this file
# Add to .gitignore if not already there
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
FOREX_API_KEY=your_forex_api_key_here
PORT=3001
NODE_ENV=development
```

**Update:** `package.json` - Add server start script

```json
{
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "server": "tsx server.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\"",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Install dependencies:**
```bash
npm install cors helmet express-rate-limit
npm install --save-dev concurrently
```

**Why:** 
- API keys never exposed to client
- Single authentication point
- Rate limiting protection
- Better error handling

---

## 5️⃣ Update Client to Use Backend Proxy

**File to update:** `src/utils/marketData.ts`

Replace external API calls:

```typescript
// REMOVE the old fetchLivePrice function that uses API keys directly

// NEW - Secure version using backend proxy
export async function fetchLivePrice(pair: string, provider: string = 'DEFAULT', apiKey: string = ''): Promise<number | null> {
  if (!validateCurrencyPair(pair)) {
    console.error(`Invalid currency pair: ${pair}`);
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Call backend proxy instead of external API
    const response = await fetch(
      `/api/price/${encodeURIComponent(pair)}?provider=${provider}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.price;
    }
    return null;
  } catch (e) {
    // Silent failure
    return null;
  }
}

// Similar update for fetchHistoricalDataPoints
export async function fetchHistoricalDataPoints(pair: string, days: number, provider: string = 'DEFAULT', apiKey: string = ''): Promise<DataPoint[]> {
  if (!validateCurrencyPair(pair)) {
    console.error(`Invalid currency pair: ${pair}`);
    return [];
  }

  // Fallback to free API (no auth needed) 
  // Move historical data fetching to backend if needed
  try {
    const step = Math.max(2, Math.floor(days / 5));
    const dates: string[] = [];
    for (let i = days - 1; i >= 1; i -= step) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    dates.push('latest');

    const apiVersion = 'v1';
    const [base, target] = pair.split('/');
    const endpoint = `currencies/${base.toLowerCase()}.json`;

    const results: DataPoint[] = [];
    for (const dateStr of dates) {
      try {
        const response = await fetch(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/${apiVersion}/${endpoint}`
        );
        if (response.ok) {
          const data = await response.json();
          const price = data[base.toLowerCase()][target.toLowerCase()];
          if (price !== undefined) {
            results.push({
              time: dateStr === 'latest' ? Date.now() : new Date(dateStr).getTime(),
              price
            });
          }
        }
      } catch (e) {
        // Continue to next date
      }
    }
    return results.reverse();
  } catch (e) {
    return [];
  }
}
```

**Why:** Client no longer handles credentials; backend manages all authentication.

---

## 6️⃣ Remove API Keys from Store

**File to update:** `src/store.ts`

Simplify the store (remove API key storage):

```typescript
// REMOVE THESE LINES (around line 116-119):
// apiProvider: localStorage.getItem('trading_game_api_provider') || 'ALPHAVANTAGE',
// apiKey: localStorage.getItem('trading_game_api_key') || import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '',

// CHANGE setApiConfig action to:
setApiConfig: (provider, key) => {
  // API keys no longer stored in client
  // Just update provider preference
  localStorage.setItem('trading_game_api_provider', provider);
  set({ apiProvider: provider });
  // Key is ignored - handled by backend
},

// CHANGE initial state to:
// In the create() function, change:
apiProvider: localStorage.getItem('trading_game_api_provider') || 'DEFAULT',
apiKey: '', // Always empty - never stored
```

**Update ApiSettingsModal to reflect this change:**

```typescript
// In src/components/ApiSettingsModal.tsx
const [apiKey, setApiKey] = useState('');  // Always empty

const handleSave = () => {
  store.setApiConfig(provider, '');  // Don't send key to store
  // Backend uses its own .env keys
  setSaved(true);
  setTimeout(() => {
    setSaved(false);
    onClose();
  }, 1000);
};
```

**Why:** Credentials never stored client-side.

---

## 7️⃣ Add Security Headers

**File to update:** `server.ts` (add after `app.use(helmet())`)

```typescript
// Enhanced security headers
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Force HTTPS (in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.alphavantage.co https://api.forexrateapi.com https://cdn.jsdelivr.net; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
  );
  
  next();
});
```

**Why:** Protects against common web attacks.

---

## 📋 Implementation Checklist

- [ ] **Step 1:** Change API input to `type="password"` in ApiSettingsModal
- [ ] **Step 2:** Add `validateCurrencyPair()` function to marketData.ts
- [ ] **Step 3:** Remove console logging with API details
- [ ] **Step 4:** Create `server.ts` backend proxy
- [ ] **Step 5:** Create/update `.env` file with API keys
- [ ] **Step 6:** Add `.env` to `.gitignore`
- [ ] **Step 7:** Update `package.json` scripts
- [ ] **Step 8:** Install new dependencies
- [ ] **Step 9:** Update client fetch calls to use `/api/` endpoints
- [ ] **Step 10:** Remove API keys from Zustand store
- [ ] **Step 11:** Test with both vite dev server and backend server running

---

## 🧪 Testing After Implementation

### 1. Check localStorage
```javascript
// In browser console - should be EMPTY or no API keys
localStorage.getItem('trading_game_api_key')
// Expected: null or ''

localStorage.getItem('incartion_total_coins')
// OK to have game progress
```

### 2. Check Network Requests
- Open DevTools → Network tab
- Make a price request
- Verify:
  - [ ] Request goes to `http://localhost:3001/api/price/...`
  - [ ] No API keys in URL
  - [ ] No API keys in request headers
  - [ ] Response is JSON with price

### 3. Check Server Console
```
Secure API proxy running on port 3001
```

### 4. Run Security Header Check
```bash
curl -i http://localhost:3001/health
```

Response should include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## ⚠️ Common Issues

### "Cannot find module 'cors'"
```bash
npm install cors
npm install --save-dev @types/express
```

### "Failed to fetch from /api/price/..."
- Ensure server is running: `npm run server`
- Check CORS configuration in server.ts
- Verify pair is in validPairs list

### API Key still not working in backend
- Check `.env` file exists in project root
- Verify `process.env.ALPHA_VANTAGE_KEY` is set
- Restart server after changing .env

---

## 🔄 Next Steps (After Phase 1)

1. **Server-side game state** - Move coin/score data to backend
2. **User authentication** - Add login/register system
3. **Data encryption** - Encrypt sensitive localStorage data
4. **Monitoring** - Add error tracking (Sentry)
5. **Testing** - Add security tests to CI/CD

---

**🚨 IMPORTANT:** Do NOT deploy to production until ALL critical fixes are implemented.

