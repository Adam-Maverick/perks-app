# Security Considerations

## Current Vulnerabilities

### Next.js Vulnerabilities (as of 2025-11-22)

**Status:** Next.js 15.0.3 has known vulnerabilities that are fixed in 15.5.6+

**Vulnerabilities:**
1. DoS with Server Actions (GHSA-7m27-7ghc-44w9)
2. Information exposure in dev server (GHSA-3h52-269p-cp9r)
3. Cache Key Confusion for Image Optimization (GHSA-g5qg-72qw-gw5v)
4. Content Injection for Image Optimization (GHSA-xv57-4mr9-wg8v)
5. Middleware Redirect SSRF (GHSA-4342-x723-ch2f)
6. Race Condition to Cache Poisoning (GHSA-qpjv-v59x-3qc4)
7. Authorization Bypass in Middleware (GHSA-f82v-jwr5-mffw)

**Why Not Fixed:**
- Updating to Next.js 15.5.6+ requires React 19 stable or newer RC version
- Current React version (19.0.0-rc-66855b96-20241106) is incompatible
- Waiting for React 19 stable release or compatible RC

**Mitigation for Development:**
- These vulnerabilities primarily affect production deployments
- Dev server exposure risk is acceptable for local development
- Do NOT deploy to production until Next.js is updated

**Action Required Before Production:**
1. Wait for React 19 stable release
2. Update to Next.js 15.5.6 or later
3. Run `npm audit` and ensure no critical/high vulnerabilities
4. Re-run Lighthouse audit after updates

### Serwist/glob Vulnerabilities

**Status:** Serwist dependencies have high-severity glob vulnerability

**Vulnerability:**
- glob CLI command injection (GHSA-5j98-mcp5-4vw2)
- Affects @serwist/build and @serwist/webpack-plugin

**Mitigation:**
- This affects build-time tooling, not runtime
- Risk is low for development
- Monitor Serwist updates for fixes

## Security Checklist for Production

- [ ] Update Next.js to 15.5.6+ (requires React 19 stable)
- [ ] Run `npm audit` and fix all critical/high vulnerabilities
- [ ] Enable HTTPS/TLS for all connections
- [ ] Configure CSP (Content Security Policy) headers
- [ ] Set up rate limiting for API routes
- [ ] Enable Clerk 2FA for admin users
- [ ] Configure environment variables in production (never commit .env)
- [ ] Run security audit tools (npm audit, Snyk, etc.)
- [ ] Test PWA offline mode in production environment
- [ ] Verify service worker caching doesn't expose sensitive data

## Development vs Production

**Development (Current):**
- Vulnerabilities present but acceptable for local dev
- No sensitive data exposed
- Not accessible from internet

**Production (Before Deploy):**
- MUST fix all critical vulnerabilities
- MUST update Next.js and React
- MUST configure proper security headers
- MUST use environment variables for secrets
