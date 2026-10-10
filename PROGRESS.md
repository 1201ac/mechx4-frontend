# NER-Logix Progress

## Decisions
- Using Java 21 with Spring Boot 3.3.4, Maven Wrapper.
- Using H2 in PostgreSQL compatibility mode for dev/test, PostgreSQL for prod.
- Frontend: Vite + React 18 + TS + Tailwind CSS + TanStack Query + React Router + Lenis + Lucide Icons + Leaflet.
- Baseline scripts check (`check.mjs`) and verification (`verify.mjs`) ran cleanly before audit fixes.
- Created `docs/FUNCTION_MATRIX.md` tracking all backend endpoints and UI routes/components against role authorization and test coverage.
- WP1 completed: replaced Maven Wrapper, added flyway postgres dependency, configured docker-compose with postgres 16 and env vars, cleaned tracked static files and temp DBs, created .env.example, added code splitting (manualChunks + React.lazy), added clean script.
- WP2 completed: fixed shipment route plan auto-generation (C1), simulator driver fix & ETA recovery (C2, C16), authenticated upload controller & auth image hook (C3), file upload magic byte validation (C4), dynamic cached RuleConfigService (C5), spec-compliant risk engine & 10min auto-recompute (C6, C7), status history restoration & 409 duplicate resolve guards (C8), field report status updates (C9), field report idempotent duplicate handling (C10), AFTER_COMMIT transactional SSE event stream (C11), driver-only shipment filter (C12), admin self-demotion/deactivation conflict guards (C15), UTF-8 token hashing (C18).
- WP3 completed: ApiKeyAuthenticationFilter for X-API-Key (S1), query-param token support removed from JwtAuthenticationFilter (S2), LoginRateLimiter enforcing 5 max failed attempts per 15 min per IP returning 429 (S3), refresh token family rotation & reuse detection returning 401 (S4), CORS policy, CSP header & security headers with 401 entry point (S5), password policy enforcing 8+ chars with upper/lower/digit/special (S6), deactivated user check in JwtAuthenticationFilter returning 401 (S7), 500 error sanitization and ResponseStatusException handling (S8).

## Blockers
- None.

## Work Packages
- [x] Step A: Baseline & Function Matrix
- [x] WP1: Build, tooling and repository hygiene
- [x] WP2: Core correctness bugs
- [x] WP3: Security
- [ ] WP4: Missing features
- [ ] WP5: Route planning directly in Google Maps
- [ ] WP6: Frontend per-role, realtime, offline, i18n, design
- [ ] WP7: Proof: tests and audits
- [ ] WP8: Docker, docs, final verification

## Notes
- WP1, WP2 & WP3 complete and verified with check.mjs and verify.mjs (16/16 E2E tests passing). Starting WP4 Missing features.
