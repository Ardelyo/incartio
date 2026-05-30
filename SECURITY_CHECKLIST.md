# 🛡️ Security Issues Quick Reference

## 📊 Summary

| Severity | Issue | File | Status |
|----------|-------|------|--------|
| 🔴 CRITICAL | API keys in localStorage | `src/store.ts` | ⚠️ UNFIXED |
| 🔴 CRITICAL | API keys in URL parameters | `src/utils/marketData.ts` | ⚠️ UNFIXED |
| 🔴 CRITICAL | Plaintext API key input | `src/components/ApiSettingsModal.tsx` | ⚠️ UNFIXED |
| 🔴 CRITICAL | No backend API proxy | `server.ts` | ❌ MISSING |
| 🟠 HIGH | Unencrypted localStorage data | `src/store.ts` | ⚠️ UNFIXED |
| 🟠 HIGH | No input validation | `src/utils/marketData.ts` | ⚠️ UNFIXED |
| 🟠 HIGH | No HTTPS enforcement | `vite.config.ts` | ⚠️ UNFIXED |
| 🟠 HIGH | No rate limiting | `server.ts` | ❌ MISSING |
| 🟠 HIGH | Poor error handling | `src/utils/marketData.ts` | ⚠️ UNFIXED |
| 🟡 MEDIUM | No CSP headers | `server.ts` | ❌ MISSING |
| 🟡 MEDIUM | Sensitive console logs | `src/utils/marketData.ts` | ⚠️ UNFIXED |

---

## 🔴 CRITICAL Priority Tasks

### Task 1: API Input Field Security
**Impact:** Prevents credential visibility  
**Effort:** 2 minutes  
**Files:** `src/components/ApiSettingsModal.tsx` line 65

```diff
- <input type="text" value={apiKey} ...>
+ <input type="password" value={apiKey} ...>
```

**✓ BEFORE DEPLOYMENT:** Must fix

---

### Task 2: Input Validation
**Impact:** Prevents injection attacks  
**Effort:** 5 minutes  
**Files:** `src/utils/marketData.ts`

Add function:
```typescript
function validateCurrencyPair(pair: string): boolean {
  return pair in PAIR_PROFILES;
}
```

Use in both fetch functions.

**✓ BEFORE DEPLOYMENT:** Must fix

---

### Task 3: Backend API Proxy
**Impact:** SECURES ALL API KEYS  
**Effort:** 30 minutes  
**Files:** Create `server.ts` + update `.env`

Key files to create/modify:
- [ ] `server.ts` (new) - Backend proxy
- [ ] `.env` (new) - Credentials storage
- [ ] `.gitignore` (update) - Never commit .env
- [ ] `package.json` (update) - Add server script
- [ ] `src/utils/marketData.ts` (update) - Call backend instead
- [ ] `src/store.ts` (update) - Remove API key storage

**✓ BEFORE DEPLOYMENT:** Must fix

---

### Task 4: Remove API Keys from Store
**Impact:** Prevents credential persistence  
**Effort:** 5 minutes  
**Files:** `src/store.ts` lines 116-119

Remove or comment out:
```typescript
// apiKey: localStorage.getItem('trading_game_api_key') || ...
```

**✓ BEFORE DEPLOYMENT:** Must fix

---

### Task 5: Remove Sensitive Logs
**Impact:** Prevents credential exposure in logs  
**Effort:** 3 minutes  
**Files:** `src/utils/marketData.ts` lines 81, 104

```diff
- console.warn(`API Fetch failed for ${provider}`, e);
+ // Silent failure
```

**✓ BEFORE DEPLOYMENT:** Must fix

---

## 🟠 HIGH Priority Tasks

### Task 6: Add Input Validation
**Impact:** Prevents injection attacks  
**Effort:** 5 minutes  
**Status:** Covered in Task 2

---

### Task 7: Security Headers
**Impact:** Protects against XSS/clickjacking  
**Effort:** 10 minutes  
**Files:** `server.ts` (add after helmet middleware)

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', '...');
  next();
});
```

**✓ BEFORE DEPLOYMENT:** Should fix

---

### Task 8: Rate Limiting
**Impact:** Prevents API abuse  
**Effort:** 5 minutes  
**Status:** Covered in Task 3 (server.ts has rateLimit)

---

### Task 9: Consistent Timeouts
**Impact:** Prevents hangs  
**Effort:** 3 minutes  
**Files:** `src/utils/marketData.ts`

Use consistent 5-second timeout:
```typescript
const timeoutId = setTimeout(() => controller.abort(), 5000);
```

**✓ BEFORE DEPLOYMENT:** Should fix

---

## 🟡 MEDIUM Priority Tasks

### Task 10: HTTPS Enforcement
**Impact:** Encrypts data in transit  
**Effort:** 10 minutes (depends on deployment)

In production, add:
```
Strict-Transport-Security: max-age=31536000
```

**✓ BEFORE PRODUCTION:** Deploy with HTTPS

---

### Task 11: Environment Variables
**Impact:** Separates secrets from code  
**Effort:** 2 minutes

Create `.env`:
```
ALPHA_VANTAGE_KEY=your_key
FOREX_API_KEY=your_key
```

Add to `.gitignore`:
```
.env
.env.local
```

**✓ BEFORE DEPLOYMENT:** Must do

---

## 📈 Implementation Timeline

### Week 1: Critical Fixes (DO FIRST)
- [ ] Task 1: Password input field (2 min)
- [ ] Task 2: Input validation (5 min)
- [ ] Task 5: Remove sensitive logs (3 min)
- [ ] Task 4: Remove API keys from store (5 min)
- [ ] Task 11: Setup .env file (2 min)
- [ ] Task 3: Backend proxy server (30 min)

**Total: ~50 minutes for CRITICAL security**

### Week 2: High Priority Fixes (SHOULD DO)
- [ ] Task 7: Security headers (10 min)
- [ ] Task 9: Fix timeouts (3 min)
- [ ] Update client API calls (15 min)

**Total: ~30 minutes**

### Week 3+: Medium Priority (NICE TO HAVE)
- [ ] Task 10: HTTPS enforcement
- [ ] Add server-side game state
- [ ] Implement user authentication

---

## ✅ Testing Checklist

After implementing fixes, verify:

### localStorage Inspection
```javascript
// Browser console - should be EMPTY
localStorage.getItem('trading_game_api_key')
// Result: null ✓
```

### Network Tab Check
- [ ] No requests to external APIs with API keys
- [ ] All price requests go to `http://localhost:3001/api/`
- [ ] No API keys visible in any request URL
- [ ] No API keys visible in request headers

### Console Check
- [ ] No API provider/key in warning messages
- [ ] No error objects with sensitive context

### Server Running
```bash
npm run server
# Output: "Secure API proxy running on port 3001"
```

### Health Check
```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":...}
```

---

## 🚨 Do NOT Deploy Until:

- ✅ Task 1: Password input implemented
- ✅ Task 2: Input validation added
- ✅ Task 3: Backend proxy running
- ✅ Task 4: API keys removed from store
- ✅ Task 5: Sensitive logs removed
- ✅ Task 11: .env configured (not committed)
- ✅ All network requests verified secure

---

## 📞 Questions Before Starting?

1. **Will you have user authentication?**
   - Affects: Server session management
   - Task impact: Add auth middleware to server

2. **What's your deployment target?**
   - Affects: HTTPS/headers strategy
   - Task impact: Task 10 depends on this

3. **Expected player base size?**
   - Affects: Rate limit configuration
   - Task impact: Task 8 configuration

4. **How long should API data cache?**
   - Affects: Backend caching strategy
   - Task impact: Add Redis/in-memory cache if needed

---

## 📚 Additional Resources

### Setup Docs Created:
1. ✅ `SECURITY_AUDIT.md` - Detailed issue analysis
2. ✅ `SECURITY_REMEDIATION.md` - Code fix examples
3. ✅ This file - Quick reference

### External Resources:
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🎯 Success Criteria

Once all CRITICAL tasks are complete:

- ✓ No API keys visible in DevTools
- ✓ No API keys in URLs or request parameters
- ✓ No API keys in localStorage
- ✓ Backend handles all authentication
- ✓ Client cannot access credentials
- ✓ Rate limiting active
- ✓ Security headers in place
- ✓ Input validation enforced

**Result:** Application is SECURE for MVP/testing phase

---

*Start with Task 1 (2 min) for quick win, then move to Task 3 (30 min) for maximum security impact.*

**Estimated time to secure: 1-2 hours for all CRITICAL items**
