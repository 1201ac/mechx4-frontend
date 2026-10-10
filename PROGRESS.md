# NER-Logix Progress

## Decisions
- Using Java 21 with Spring Boot 3.3.4, Maven Wrapper.
- Using H2 in PostgreSQL compatibility mode for dev/test, PostgreSQL for prod.
- Frontend: Vite + React 18 + TS + Tailwind CSS + TanStack Query + React Router + Lenis + Lucide Icons + Leaflet.
- Baseline scripts check (`check.mjs`) and verification (`verify.mjs`) ran cleanly before audit fixes.
- Created `docs/FUNCTION_MATRIX.md` tracking all backend endpoints and UI routes/components against role authorization and test coverage.

## Blockers
- None.

## Work Packages
- [x] Step A: Baseline & Function Matrix
- [ ] WP1: Build, tooling and repository hygiene
- [ ] WP2: Core correctness bugs
- [ ] WP3: Security
- [ ] WP4: Missing features
- [ ] WP5: Route planning directly in Google Maps
- [ ] WP6: Frontend per-role, realtime, offline, i18n, design
- [ ] WP7: Proof: tests and audits
- [ ] WP8: Docker, docs, final verification

## Notes
- Session initialized. Baseline check and verify passed. Function matrix created. Proceeding to WP1.
