# FINCARS Security Checklist

Status note: the critical client-side credential exposure items have been remediated in this working tree. Remaining hardening items depend on deployment configuration and whether game economy data should become server-authoritative.

## Summary

| Severity | Issue | File | Status |
|----------|-------|------|--------|
| CRITICAL | API keys in localStorage | `src/store.ts` | FIXED |
| CRITICAL | API keys in URL parameters | `src/utils/marketData.ts` | FIXED |
| CRITICAL | Plaintext API key input | `src/components/ApiSettingsModal.tsx` | FIXED |
| CRITICAL | No backend API proxy | `server.ts` | FIXED |
| HIGH | Unencrypted localStorage data | `src/store.ts` | PARTIAL |
| HIGH | No input validation | `src/utils/marketData.ts`, `server.ts` | FIXED |
| HIGH | No HTTPS enforcement | Deployment config | PENDING |
| HIGH | No rate limiting | `server.ts` | FIXED |
| HIGH | Poor error handling | `src/utils/marketData.ts`, `server.ts` | FIXED |
| MEDIUM | No CSP headers | `server.ts` | FIXED |
| MEDIUM | Sensitive console logs | `src/utils/marketData.ts` | FIXED |

## Implemented

- Added `server.ts` as a backend market data proxy.
- Moved provider credentials to backend-only environment variables: `ALPHA_VANTAGE_KEY` and `FOREX_API_KEY`.
- Updated `src/utils/marketData.ts` to call same-origin `/api/price` and `/api/history` endpoints.
- Removed browser-side API key input and API key persistence.
- Added currency-pair validation on both client and server.
- Added request timeouts, sanitized error responses, simple in-memory rate limiting, short-lived cache, and security headers.
- Renamed visible platform branding to FINCARS.

## Verification

- `npm install --package-lock-only`
- `npm run lint`
- `npm run build`
- `curl http://localhost:3001/api/health`
- Opened `http://localhost:3000` in the in-app browser and checked for console errors.

## Remaining Before Production

- Enforce HTTPS at the hosting/load-balancer layer.
- Decide whether coins, unlocks, and scores should stay local-only or move to a server-authoritative profile system.
- Configure real provider keys in `.env`; do not use `VITE_` prefixes for secrets.
- Rotate any API key that was previously entered into the browser version.
