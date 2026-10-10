# NER-Logix

**Logistics and Accessibility Management Platform for the North Eastern Region**

> Fast, structured and transparent essential goods coordination.

---

## 1. Overview & Problem Addressed
The North Eastern Region (NER) of India faces severe logistics and accessibility challenges from landslides, flash floods, monsoon rainfall, and road damage. **NER-Logix** is a rule-based operational software platform that integrates GPS vehicle tracking, GIS mapping, manual field reports, and weather logging into a central database. It provides authorities and logistics operators real-time visibility, automated route risk scores, incident notifications, and dynamic safer route recommendations.

---

## 2. Seeded Operational Accounts
All demo accounts share the password: `Demo@1234`

| Email | Role | Access Scope |
|---|---|---|
| `admin@nerlogix.com` | **ADMIN** | System owner, user management, rule config, API key generation, audit log, demo simulation tools. |
| `moderator@nerlogix.com` | **MODERATOR** | Field report verification, incident history management, alert acknowledgment/resolution, fleet & shipment controls. |
| `user@nerlogix.com` | **USER / DRIVER** | GIS map, field reporting (online/offline), weather logs, driver navigation mode, safer route acceptance. |

---

## 3. Operational Pipeline
```
1 Field event / GPS created  -> 2 Data upload / offline sync -> 3 Central DB processing
                                                                     |
6 Route action / response  <- 5 In-app alerts broadcasted    <- 4 GIS & Dashboard update
```

---

## 4. Quickstart & Command Scripts

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

## 5. Integration API Key Ingest Examples

External transport monitoring systems and weather stations send automated updates using header `X-API-Key: nk_...`:

### 5.1 Ingest Road Segment Status
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

### 5.2 Ingest Weather Sensor Log
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

### 5.3 Ingest Vehicle Fleet Positions
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

---

## 6. Docker Deployment

Build and run using Docker Compose:
```bash
docker-compose up --build
```
Access the application at `http://localhost:8080`.
