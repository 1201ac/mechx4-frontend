# NER-Logix Progress

## Decisions
- Using Java 21 with Spring Boot 3.3.4, Maven Wrapper.
- Using H2 in PostgreSQL compatibility mode for dev/test, PostgreSQL for prod.
- Frontend: Vite + React 18 + TS + Tailwind CSS + TanStack Query + React Router + Lenis + Lucide Icons + Leaflet.

## Blockers
- None.

## Phase Checklist
- [x] Phase 1: Foundation (Maven wrapper, Spring Boot app, Vite frontend, scripts, Playwright)
- [x] Phase 2: Schema, seed, auth, first slice
- [x] Phase 3: Landing page
- [x] Phase 4: GIS dashboard, roads, blocked route status
- [x] Phase 5: Weather and rule engine
- [x] Phase 6: Route planner
- [ ] Phase 7: Vehicles, shipments, GPS tracking, delivery status
- [ ] Phase 8: Field reporting, offline sync, incident history
- [ ] Phase 9: Alert system, notifications, languages, full pipeline
- [ ] Phase 10: Reroute and Driver mode
- [ ] Phase 11: Dashboards and analytics
- [ ] Phase 12: Central management and integrations
- [ ] Phase 13: Polish and hardening
- [ ] Phase 14: Docker, README, final verification

## Notes
- Completed Phase 6: Route planner with Dijkstra algorithm, penalizing prior route edges for up to 3 alternatives, delay estimates formula, emergency mode risk weighting, RoutePlannerPage UI with Leaflet polyline overlay, unit test, and Playwright spec e2e/planner.spec.ts. verify.mjs fully green.
