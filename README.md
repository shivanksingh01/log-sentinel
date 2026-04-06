# 🛡️ Log Sentinel

**A production-grade Log-Based Intrusion Detection System (IDS) built on Node.js + Express.**

Log Sentinel continuously monitors a mounted `/logs` directory, parses structured security events in real time, and evaluates them against **10 independent detection rules** covering the most common application-layer attack patterns. Alerts are surfaced instantly via REST APIs and a live Server-Sent Events (SSE) stream.

---

## Detection Coverage

| Rule | Type | Severity | Description |
|---|---|---|---|
| `BRUTE_FORCE_LOGIN` | Behavioral | MEDIUM → HIGH | Same IP, many failed logins in a time window |
| `CREDENTIAL_STUFFING` | Behavioral | MEDIUM | Same IP tries many different usernames |
| `DISTRIBUTED_ACCOUNT_ATTACK` | Behavioral | MEDIUM | Many IPs targeting the same account |
| `POSSIBLE_COMPROMISE` | Behavioral | HIGH | Failures followed by a successful login |
| `REQUEST_ABUSE` | Rate-based | MEDIUM | High request rate from a single IP |
| `SCANNER_DETECTED` | Behavioral | HIGH | IP probing many distinct paths (Nikto/dirbuster pattern) |
| `FORBIDDEN_ACCESS_PROBE` | Rate-based | MEDIUM | Repeated 403 hits indicating recon |
| `PATH_TRAVERSAL_ATTEMPT` | Signature | HIGH | `../../etc/passwd`, `%2e%2e`, etc. |
| `SQL_INJECTION_PROBE` | Signature | HIGH | UNION-based, boolean-based, time-based SQLi patterns |
| `HIGH_ERROR_RATE` | Rate-based | MEDIUM | IP generating >80% 4xx/5xx responses |

---

## Architecture

```text
                         ┌─────────────────────────────┐
  Application APIs  ─── ▶│   /logs/app.log (mounted)   │
                         └────────────┬────────────────┘
                                      │ fs.watch + offset tracking
                                      ▼
                         ┌─────────────────────────────┐
                         │     Watcher Service          │
                         │  (reads only new bytes)      │
                         └────────────┬────────────────┘
                                      │ raw log line
                                      ▼
                         ┌─────────────────────────────┐
                         │     Parser Service           │
                         │  key=value → LogEvent model  │
                         └────────────┬────────────────┘
                                      │ normalized event
                                      ▼
                         ┌─────────────────────────────┐
                         │     Detection Engine         │◀── State Service (in-memory)
                         │  10 rules evaluated per      │    Sliding time windows
                         │  event in pipeline order     │    Periodic GC
                         └────────────┬────────────────┘
                                      │ alert payload
                                      ▼
                         ┌─────────────────────────────┐
                         │     Alert Service            │
                         │  Deduplication / cooldown    │
                         └────┬──────────┬─────────────┘
                              │          │
                    ┌─────────▼──┐  ┌────▼──────────────┐
                    │ SSE Stream │  │  Persistence +      │
                    │ (live push)│  │  Notifications      │
                    └────────────┘  └────────────────────┘
```

---

## Quick Start

### Option A — Run with Docker (Recommended)

This matches the exact test command from the problem spec.

```bash
# 1. Clone the repository
git clone https://github.com/shivanksingh01/log-sentinel.git
cd log-sentinel

# 2. Copy and configure environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Build the Docker image
docker build -t intrusion-detector .

# 4. Run with the /logs volume mounted
docker run -p 8080:8080 -v $(pwd)/logs:/logs intrusion-detector
```

> **Windows PowerShell users:** use `${PWD}\logs` instead of `$(pwd)/logs`
> ```powershell
> docker run -p 8080:8080 -v ${PWD}\logs:/logs intrusion-detector
> ```

The server starts and listens for log changes in real time. Any new lines written to `./logs/app.log` on your host will be detected automatically.

---

### Option B — Run Locally (Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start the server
npm start

# Or with auto-reload (development)
npm run dev
```

---

## How Log Detection Works

Log Sentinel watches `/logs/app.log` using Node.js `fs.watch` with byte-offset tracking. When new log lines appear, the system:

1. **Parses** the line: `2024-01-01T12:00:00Z event=FAILED_LOGIN ip=1.2.3.4 user=alice path=/auth/login status=401 method=POST`
2. **Updates state**: increments sliding-window counters for the IP/user
3. **Evaluates all 10 rules** in order, generating alerts as needed
4. **Deduplicates** alerts by type+IP with configurable cooldowns (prevents alert storms)
5. **Broadcasts** via SSE to all connected clients
6. **Persists** to `data/alerts.json` (NDJSON)

---

## Generate Alerts – Trigger Attacks

### Method 1 — Automated simulation (quickest)

```bash
node scripts/simulate-attacks.js
```

Runs 10 distinct attack scenarios automatically:
1. Brute Force (MEDIUM → HIGH escalation)
2. Credential Stuffing
3. Distributed Account Attack
4. Account Compromise (fail-then-success)
5. Request Abuse / DDoS
6. Scanner / Bot Detection
7. Forbidden Access Probing
8. Path Traversal (direct log injection)
9. SQL Injection Probe (direct log injection)
10. High Error Rate Fuzzer

---

### Method 2 — Manual API calls (Postman)

Import the Postman collection from `docs/postman/Log-Sentinel.postman_collection.json`.

**Trigger brute force manually:**
```bash
# Send this 5+ times in quick succession
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'
```

**Trigger path traversal:**
```bash
# Inject directly into the log file:
echo "$(date -u +%Y-%m-%dT%H:%M:%S.000Z) event=REQUEST ip=1.2.3.4 path=/../../../etc/passwd status=400 method=GET" >> logs/app.log
```

---

### Method 3 — Direct log injection (any format tool)

Since the detection engine only reads `logs/app.log`, you can write any log line directly:

```bash
# SQL Injection probe
echo "$(date -u +%Y-%m-%dT%H:%M:%S.000Z) event=REQUEST ip=5.5.5.5 path=%27+UNION+SELECT+1--&method=GET status=400 method=GET" >> ./logs/app.log
```

---

## Alert APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Server health check |
| `GET` | `/api/v1/alerts` | All alerts (supports `?severity=HIGH&type=BRUTE_FORCE_LOGIN&limit=20`) |
| `GET` | `/api/v1/alerts/latest` | 10 most recent alerts |
| `GET` | `/api/v1/alerts/summary` | Counts by type and severity |
| `GET` | `/api/v1/alerts/stream` | **Live Server-Sent Events stream** |
| `GET` | `/api/v1/stats` | Processing stats (lines parsed, errors, alerts) |

### Live SSE Stream (Postman or browser)

```
GET http://localhost:8080/api/v1/alerts/stream
Accept: text/event-stream
```

Each alert is pushed as:
```
event: alert
data: {"id":"alert_001","type":"BRUTE_FORCE_LOGIN","severity":"MEDIUM","ip":"1.2.3.4",...}
```

---

## Tuning Detection Thresholds

All thresholds are configurable via `.env`. See `.env.example` for the full list.

```env
# Lower brute force threshold for stricter environments
BRUTE_FORCE_THRESHOLD=3
BRUTE_FORCE_WINDOW_SEC=30

# Tighten scanner detection
SCANNER_PATH_THRESHOLD=5
SCANNER_WINDOW_SEC=15
```

---

## Project Structure

```text
log-sentinel/
├── src/
│   ├── config/
│   │   ├── detection.js          # Tunable detection thresholds (env-driven)
│   │   ├── env.js                # Environment config loader
│   │   └── logger.js             # Winston logger
│   ├── models/
│   │   ├── Alert.js              # Alert data model
│   │   └── Event.js              # Normalized log event model
│   ├── rules/                    # ← Detection rules (add new ones here)
│   │   ├── bruteForce.rule.js
│   │   ├── credentialStuffing.rule.js
│   │   ├── distributedAttack.rule.js
│   │   ├── failThenSuccess.rule.js
│   │   ├── forbiddenProbe.rule.js
│   │   ├── highErrorRate.rule.js
│   │   ├── pathTraversal.rule.js
│   │   ├── requestAbuse.rule.js
│   │   ├── scannerDetection.rule.js
│   │   └── sqliProbe.rule.js
│   ├── services/
│   │   ├── alert.service.js      # Alert lifecycle + deduplication
│   │   ├── detection.service.js  # Rule orchestrator
│   │   ├── logProcessor.service.js
│   │   ├── logWriter.service.js  # Writes to /logs/app.log
│   │   ├── parser.service.js     # Raw line → LogEvent
│   │   ├── sse.service.js        # SSE connection manager
│   │   ├── state.service.js      # In-memory sliding window state + GC
│   │   ├── stats.service.js
│   │   └── watcher.service.js    # fs.watch + offset tracking
│   ├── notifications/
│   │   ├── emailNotifier.js
│   │   ├── notification.service.js
│   │   └── webhookNotifier.js
│   ├── persistence/
│   │   └── fileStore.service.js  # NDJSON alert persistence
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── scripts/
│   └── simulate-attacks.js       # 10-scenario attack simulator
├── docs/
│   ├── architecture/
│   │   ├── high-level-design.md
│   │   └── low-level-design.md
│   ├── postman/
│   │   └── Log-Sentinel.postman_collection.json
│   └── assets/postman-screenshots/
├── logs/                         # Mounted volume — log files live here
├── data/                         # Persisted alerts (auto-created)
├── Dockerfile                    # Multi-stage, non-root production image
├── .env.example                  # All configuration options documented
├── assumptions.md                # Design assumptions
└── todo.md                       # Future improvements
```

---

## Engineering Decisions

- **In-memory state over DB** — Eliminates external dependency. State resets on restart, which is acceptable for a time-windowed detection system where stale state is irrelevant.
- **NDJSON file persistence** — Append-only, no parsing overhead, survives restarts without full file rewrites.
- **Rule isolation** — Every rule is a pure function `(event, stateService) => alertData | null`. Adding a new detection rule requires only creating one file and registering it in `detection.service.js`.
- **Failure isolation** — Notification failures, persistence failures, and rule evaluation exceptions are all caught locally and logged. The core detection pipeline never breaks.
- **Non-root Docker user** — Runs as `sentinel:sentinel` to limit container privilege escalation.
