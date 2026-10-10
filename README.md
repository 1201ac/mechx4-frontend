# NER-Logix

**Logistics and Accessibility Management Platform for the North Eastern Region**

> Fast, structured and transparent essential goods coordination.

---

## 1. Overview & Problem Addressed
The North Eastern Region (NER) of India faces severe logistics and accessibility challenges from landslides, flash floods, heavy monsoon rainfall, and road damage. **NER-Logix** is a conventional, rule-based operational platform that integrates GPS vehicle tracking, GIS mapping, manual field reports, and weather logging into a central database. It provides authorities and logistics operators real-time operational visibility, rule-based risk alerts, incident history logs, and dynamic safer route recommendations.

---

## 2. Seeded Operational Accounts
All seeded demo accounts share the password: `Demo@1234`

| Email | Role | Access Scope |
|---|---|---|
| `admin@nerlogix.com` | **ADMIN** | System owner, user management, rule config, API key generation, audit log, demo simulation tools. |
| `moderator@nerlogix.com` | **MODERATOR** | Field report verification, incident history management, alert acknowledgment/resolution, fleet & shipment controls, emergency mode. |
| `user@nerlogix.com` | **USER / DRIVER** | GIS map, field reporting (online/offline), weather logs, driver navigation mode, safer route acceptance. |

---

## 3. Operational Pipeline
```
1 Field event / GPS created  -> 2 Data upload / offline sync -> 3 Central DB processing
                                                                     |
6 Route action / response  <- 5 In-app alerts broadcasted    <- 4 GIS & Dashboard update
```

---

## 4. Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` | Profile (`dev` for H2, `prod` for PostgreSQL) |
| `SPRING_DATASOURCE_URL` | `jdbc:h2:file:./data/nerlogix;...` | Database connection URL |
| `SPRING_DATASOURCE_USERNAME` | `sa` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `""` | Database password |
| `NERLOGIX_JWT_SECRET` | *(required in prod)* | JWT signing secret (must be ≥ 32 characters) |
| `NERLOGIX_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8080` | Allowed CORS origins |
| `NERLOGIX_UPLOADS_DIR` | `./uploads` | Directory for uploaded field report images |
| `NERLOGIX_WEATHER_AUTO_FETCH` | `true` | Enable automated weather fetch from Open-Meteo |
| `NERLOGIX_SIMULATION_ENABLED` | `true` | Enable background vehicle movement simulator |
| `NERLOGIX_SIMULATION_TICK_MS` | `3000` | Simulator tick interval in milliseconds |
| `GOOGLE_ROUTES_API_KEY` | `""` | Google Maps / Routes API key |
| `VITE_GOOGLE_MAPS_API_KEY` | `""` | Frontend Google Maps Javascript API key |
| `VITE_GOOGLE_MAP_ID` | `""` | Frontend Google Maps Vector Map ID |

> [!SECURITY NOTE]
> Any hardcoded legacy secrets in past git commits have been rotated. In production, set a strong, random 256-bit key in `NERLOGIX_JWT_SECRET`.

---

## 5. Quickstart & Development Commands

Requires Node.js 18+ and Java 21 JDK.

### Run Development Servers (Backend 8080 + Vite Dev Server 5173)
```bash
node scripts/dev.mjs
```

### Run Quality Checks (Backend Compile + Unit Tests, Frontend Typecheck + Lint + Tests)
```bash
node scripts/check.mjs
```

### Build Runnable Production JAR
```bash
node scripts/build.mjs
```

### Run End-to-End Verification (Builds JAR, launches temporary H2 server, executes Playwright E2E suite)
```bash
node scripts/verify.mjs
```

---

## 6. Docker Deployment

To build and launch the production application stack (Spring Boot app + PostgreSQL 16 database):

```bash
cp .env.example .env
# Edit .env to set your passwords and API keys
docker-compose up --build -d
```

The application will be accessible at `http://localhost:8080`.
Swagger API Documentation is available at `http://localhost:8080/api/docs`.

---

## 7. Integration API Key Ingest Examples

External transport monitoring systems and weather stations send automated updates using header `X-API-Key: nk_...`:

### 7.1 Ingest Road Segment Status
```http
POST /api/integrations/road-status
X-API-Key: nk_your_secret_api_key
Content-Type: application/json

{
  "segmentId": 3,
  "status": "BLOCKED",
  "reason": "Landslide detected by highway sensors"
}
```

### 7.2 Ingest Weather Sensor Log
```http
POST /api/integrations/weather
X-API-Key: nk_your_secret_api_key
Content-Type: application/json

{
  "districtId": 1,
  "condition": "EXTREME",
  "rainMm": 140.5,
  "note": "Automated rainfall sensor reading"
}
```

### 7.3 Ingest Vehicle Fleet Positions
```http
POST /api/integrations/assets
X-API-Key: nk_your_secret_api_key
Content-Type: application/json

[
  {
    "vehicleId": 1,
    "lat": 26.1445,
    "lng": 91.7362,
    "heading": 90,
    "speedKmph": 48.5
  }
]
```
