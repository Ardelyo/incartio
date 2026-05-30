# Security Audit Report - Incartion

**Date:** May 30, 2026  
**Project:** Incartion (Currency Trading Game)  
**Type:** Security & Data Protection Review

---

## Executive Summary

This audit identified **11 critical and high-severity security issues** affecting API protection, data handling, and user privacy. The application exposes API keys, stores sensitive data in plaintext, and lacks essential security controls. **Immediate remediation is required before production deployment.**

---

## 🔴 Critical Issues

### 1. **API Keys Exposed in localStorage** ⚠️ CRITICAL
**Severity:** CRITICAL  
**Location:** [src/store.ts](src/store.ts#L116-L119)  
**Issue:** API keys are stored directly in browser localStorage without encryption.

```typescript
apiProvider: localStorage.getItem('trading_game_api_provider') || 'ALPHAVANTAGE',
apiKey: localStorage.getItem('trading_game_api_key') || import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '',
```

**Risk:**
- Any XSS vulnerability exposes all API keys
- Keys persist indefinitely and survive browser session
- Accessible via browser DevTools → Application → localStorage
- Any script running on the page can read all keys

**Impact:** Account compromise, API quota abuse, financial loss

**Remediation:**
- ✅ Move API keys to backend only
- ✅ Use environment variables for build-time secrets only
- ✅ Implement backend proxy for API calls
- ✅ Use session tokens instead of storing credentials client-side

---

### 2. **API Keys in URL Query Parameters** ⚠️ CRITICAL
**Severity:** CRITICAL  
**Location:** [src/utils/marketData.ts](src/utils/marketData.ts#L34), [L45](src/utils/marketData.ts#L45), [L94](src/utils/marketData.ts#L94)  
**Issue:** API keys are embedded directly in URLs passed to fetch().

```typescript
// Line 34: Alpha Vantage
const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${target}&apikey=${apiKey}`;

// Line 45: ForexRateAPI  
const url = `https://api.forexrateapi.com/v1/latest?api_key=${apiKey}&base=${base}&currencies=${target}`;

// Line 94: Historical data
const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${base}&to_symbol=${target}&apikey=${apiKey}`;
```

**Risk:**
- ✓ Keys logged in browser console, Network tab
- ✓ Keys stored in browser history
- ✓ Keys appear in server logs of external APIs
- ✓ Keys captured by proxy/VPN/network monitoring
- ✓ Keys exposed in bookmarks/shared links

**Impact:** Compromised API access, resource abuse

**Remediation:**
- ✅ Use HTTP Authorization headers instead of query parameters
- ✅ Implement backend proxy middleware
- ✅ Move API calls server-side with proper authentication

---

### 3. **Plaintext Credential Storage** ⚠️ CRITICAL
**Severity:** CRITICAL  
**Location:** [src/components/ApiSettingsModal.tsx](src/components/ApiSettingsModal.tsx#L33-L44)  
**Issue:** User enters API keys via UI with no encryption or masking.

```typescript
<input
  type="text"  // ← Should be type="password"
  value={apiKey}
  onChange={(e) => setApiKey(e.target.value)}
  placeholder="Enter your API Key..."
/>
```

**Risk:**
- ✓ Keys visible on screen in plaintext
- ✓ Physical/screenshot security risk
- ✓ No masking for shoulder-surfing
- ✓ Keys stored visibly in state

**Remediation:**
- ✅ Change input `type="text"` to `type="password"`
- ✅ Mask stored credentials with dots/asterisks
- ✅ Implement secure credential entry UI
- ✅ Never display full API keys after entry

---

### 4. **No Backend API Proxy** ⚠️ CRITICAL
**Severity:** CRITICAL  
**Issue:** All API calls made directly from client browser.

**Risk:**
- ✓ Client-side secrets exposed
- ✓ No rate limiting/protection
- ✓ CORS issues with some providers
- ✓ No ability to add authentication/middleware
- ✓ Direct exposure of third-party integrations

**Remediation:**
- ✅ Create Express backend server (already in package.json)
- ✅ Proxy all external API calls through backend
- ✅ Store API keys only in backend `.env` file
- ✅ Implement rate limiting/caching on backend

---

## 🟠 High Severity Issues

### 5. **Sensitive Data in localStorage Without Encryption** 🔓
**Severity:** HIGH  
**Location:** [src/store.ts](src/store.ts#L18-L28)  
**Issue:** Game progress, coins, and profile data stored unencrypted.

```typescript
function saveTotalCoins(n: number) {
  localStorage.setItem('incartion_total_coins', String(n));
}

function saveProfile(profile: any) {
  localStorage.setItem('incartion_profile', JSON.stringify(profile));
}
```

**Risk:**
- ✓ Players can modify scores/coins by editing localStorage
- ✓ Cheating by manually altering values
- ✓ No integrity verification
- ✓ Profile data exposed to XSS attacks

**Remediation:**
- ✅ Store game state on secure backend
- ✅ Use signed tokens/signatures for client-side data
- ✅ Implement server-side state validation
- ✅ Add data integrity checks (HMAC signatures)

---

### 6. **No Input Validation on Currency Pairs** 🔓
**Severity:** HIGH  
**Location:** [src/utils/marketData.ts](src/utils/marketData.ts#L25-L26)  
**Issue:** Currency pair input not validated before API calls.

```typescript
export async function fetchLivePrice(pair: string, ...): Promise<number | null> {
  const [base, target] = pair.split('/');
  if (!base || !target) return null;  // ← Only checks if empty
  
  // Directly used in URLs without sanitization
  const url = `https://www.alphavantage.co/query?...&from_currency=${base}&to_currency=${target}...`;
}
```

**Risk:**
- ✓ Injection attacks possible
- ✓ Unexpected API calls
- ✓ Path traversal in URLs

**Remediation:**
- ✅ Whitelist allowed currency pairs
- ✅ Validate against [PAIR_PROFILES](src/utils/marketData.ts#L15)
- ✅ Use URL validation libraries
- ✅ Implement strict input sanitization

---

### 7. **No HTTPS or Transport Security** 🔓
**Severity:** HIGH  
**Location:** [vite.config.ts](vite.config.ts)  
**Issue:** Development server runs unencrypted, no TLS enforcement.

```typescript
server: {
  hmr: process.env.DISABLE_HMR !== 'true',
```

**Risk:**
- ✓ Man-in-the-middle attacks possible
- ✓ Credentials transmitted in plaintext
- ✓ No protection for API keys in transit

**Remediation:**
- ✅ Enable HTTPS in production (use deployment platform SSL)
- ✅ Set HSTS header to force HTTPS
- ✅ Use secure cookies (httpOnly, secure, sameSite)
- ✅ Upgrade mixed-content warnings to errors

---

### 8. **No CORS or Rate Limiting** 🔓
**Severity:** HIGH  
**Location:** [src/utils/marketData.ts](src/utils/marketData.ts#L25-L87)  
**Issue:** Multiple API calls with no rate limiting or caching.

**Risk:**
- ✓ API quota exhaustion
- ✓ Denial of service vulnerability
- ✓ Cross-origin requests not properly validated
- ✓ No caching = excessive API calls

**Remediation:**
- ✅ Implement request caching (5-10 minute TTL)
- ✅ Add rate limiting (5 requests/minute per user)
- ✅ Implement backend rate limiting
- ✅ Add request deduplication

---

### 9. **Timeout Issues and Missing Error Handling** 🔓
**Severity:** HIGH  
**Location:** [src/utils/marketData.ts](src/utils/marketData.ts#L29-L31), [L105-L109]  
**Issue:** Inconsistent timeout handling and weak error recovery.

```typescript
const timeoutId = setTimeout(() => controller.abort(), 3000);  // 3s
// ...
const timeoutId = setTimeout(() => controller.abort(), 1500);  // 1.5s
```

**Risk:**
- ✓ Inconsistent timeout values
- ✓ Silent failures without user notification
- ✓ No retry logic
- ✓ Potential infinite hangs

**Remediation:**
- ✅ Use consistent 5-second timeout
- ✅ Implement exponential backoff retry
- ✅ Show user-facing error messages
- ✅ Add logging for debugging

---

## 🟡 Medium Severity Issues

### 10. **No Content Security Policy (CSP)** 🔓
**Severity:** MEDIUM  
**Issue:** Missing security headers and CSP configuration.

**Risk:**
- ✓ XSS attacks easier to exploit
- ✓ No protection against inline scripts
- ✓ External scripts can load without validation

**Remediation:**
- ✅ Add CSP header:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.alphavantage.co https://api.forexrateapi.com https://cdn.jsdelivr.net
  ```
- ✅ Add security headers (X-Frame-Options, X-Content-Type-Options)
- ✅ Implement Subresource Integrity (SRI) for CDN resources

---

### 11. **Console Logging of Sensitive Data** 🔓
**Severity:** MEDIUM  
**Location:** [src/utils/marketData.ts](src/utils/marketData.ts#L81), [L104]  
**Issue:** Debug logging of API operations includes sensitive context.

```typescript
console.warn(`API Fetch failed for ${provider}`, e);
console.warn("AlphaVantage historical failed", e);
```

**Risk:**
- ✓ Error objects may contain URL/API key context
- ✓ Logs captured in monitoring/error tracking systems
- ✓ Debug info exposed in production

**Remediation:**
- ✅ Remove console.warn/error with sensitive context
- ✅ Use structured logging without credentials
- ✅ Add log redaction for PII/secrets
- ✅ Use error tracking (Sentry) with sanitization

---

## 📋 Missing Security Controls

### Required But Not Implemented:
1. **✗ Authentication/Authorization** - No user accounts or role validation
2. **✗ Rate Limiting** - No protection against brute force or abuse
3. **✗ Input Validation** - Minimal sanitization
4. **✗ Output Encoding** - Potential XSS vectors
5. **✗ Encryption** - No data at rest encryption
6. **✗ Audit Logging** - No security event tracking
7. **✗ API Key Rotation** - No key management process
8. **✗ Dependency Scanning** - No vulnerability scanning in CI/CD
9. **✗ OWASP Headers** - Missing security headers
10. **✗ Error Handling** - Generic error messages needed

---

## 🔧 Recommended Architecture Changes

### Current (Vulnerable):
```
Browser (Client)
    ↓ [API Key in URL]
    ↓
External APIs (AlphaVantage, ForexRateAPI)
    
Problem: API keys exposed in transit and at rest
```

### Recommended (Secure):
```
Browser (Client)
    ↓ [HTTP Request]
    ↓
Backend Server (Express)
    ↓ [HTTPS + Authorization Header]
    ↓
External APIs
    
Benefits:
- API keys never leave backend
- Single point of authentication
- Rate limiting/caching
- Better error handling
```

---

## 🚀 Implementation Roadmap

### Phase 1: Immediate (CRITICAL - Before Production)
- [ ] Move API keys to backend only via Express
- [ ] Remove API keys from localStorage
- [ ] Implement backend proxy for all external API calls
- [ ] Change ApiSettingsModal to use type="password"
- [ ] Remove API keys from URL parameters
- [ ] Add HTTPS enforcement

### Phase 2: Short Term (1-2 weeks)
- [ ] Implement server-side state management for game progress
- [ ] Add input validation/whitelisting for currency pairs
- [ ] Implement caching and rate limiting
- [ ] Add proper error handling and user feedback
- [ ] Add security headers (CSP, HSTS, etc.)

### Phase 3: Medium Term (1 month)
- [ ] Implement user authentication system
- [ ] Add audit logging and monitoring
- [ ] Implement dependency vulnerability scanning
- [ ] Add HMAC signatures for client-side data integrity
- [ ] Set up security testing (SAST/DAST)

### Phase 4: Long Term (Ongoing)
- [ ] Implement API key rotation policy
- [ ] Add rate limiting per user/IP
- [ ] Implement WAF rules
- [ ] Regular security audits
- [ ] Incident response plan

---

## 📝 Code Examples: Quick Fixes

### Fix 1: Use password input type
**File:** [src/components/ApiSettingsModal.tsx](src/components/ApiSettingsModal.tsx#L65)

Change from:
```typescript
<input type="text" value={apiKey} ... />
```

To:
```typescript
<input type="password" value={apiKey} ... />
```

---

### Fix 2: Validate currency pairs
**File:** [src/utils/marketData.ts](src/utils/marketData.ts#L25-L27)

Add:
```typescript
export async function fetchLivePrice(pair: string, ...): Promise<number | null> {
  // Validate currency pair
  if (!PAIR_PROFILES[pair]) {
    console.error('Invalid currency pair');
    return null;
  }
  
  const [base, target] = pair.split('/');
  if (!base || !target) return null;
  // ... rest
}
```

---

### Fix 3: Backend proxy structure (Node.js/Express)

Create `server.ts`:
```typescript
import express from 'express';

const app = express();

// Backend-only route: API key stored in .env
app.get('/api/price/:pair', async (req, res) => {
  const { pair } = req.params;
  const apiKey = process.env.ALPHA_VANTAGE_KEY; // ← Secure
  
  // Call external API with credentials
  const url = `https://www.alphavantage.co/query?...&apikey=${apiKey}`;
  const response = await fetch(url);
  res.json(response);
});

app.listen(3001);
```

Update client to call backend:
```typescript
// OLD (Vulnerable):
const data = await fetch(`https://api.alphavantage.co/query?apikey=${apiKey}...`);

// NEW (Secure):
const data = await fetch(`/api/price/USD%2FIDR`);
```

---

## 🛡️ Security Headers Template

Add to your backend/server headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.alphavantage.co https://api.forexrateapi.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 📚 Dependencies Review

**Current dependencies potentially at risk:**

| Package | Risk | Action |
|---------|------|--------|
| `@google/genai` | External API | Verify SSL certificates, keep updated |
| `express` | Server security | Keep updated, use security middleware |
| `dotenv` | Config handling | Ensure .env never committed to git |

**Add for security:**
```bash
npm install helmet express-rate-limit cors
npm install --save-dev @types/helmet snyk
```

Update server.ts:
```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet()); // Security headers
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

---

## ✅ Testing & Validation

### Manual Security Testing:
1. **localStorage inspection** - Check DevTools → Application
   - [ ] No API keys visible
   - [ ] No sensitive game data visible

2. **Network inspection** - Check DevTools → Network
   - [ ] No API keys in request URLs
   - [ ] No API keys in request headers
   - [ ] HTTPS used for all requests

3. **XSS Testing** - Try injecting in inputs
   - [ ] `<script>alert('xss')</script>`
   - [ ] `javascript:alert('xss')`
   - [ ] Should be escaped or blocked

### Automated Security Tests:
```bash
npm install --save-dev snyk @owasp/dependency-check
snyk test  # Check for vulnerabilities
```

---

## 📞 Questions & Clarifications Needed

1. **Will this app have user accounts?** → Affects auth strategy
2. **Production deployment target?** → Affects HTTPS/headers strategy
3. **Expected player base size?** → Affects rate limiting requirements
4. **Data retention requirements?** → Affects backend storage needs

---

## 📖 References & Resources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Web Security Academy](https://portswigger.net/web-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

---

## 📌 Summary

**This application requires immediate remediation before any production use.** The primary issues are:

1. ✗ API keys exposed in client-side storage and URLs
2. ✗ No backend protection layer
3. ✗ Sensitive data stored unencrypted
4. ✗ Missing input validation
5. ✗ No security controls

**Estimated remediation effort:** 20-40 hours for Phase 1 (critical fixes)

**Priority:** 🔴 CRITICAL - Do not deploy to production until addressed.

---

*Report prepared: May 30, 2026*  
*Next review recommended: After implementing Phase 1 fixes*
