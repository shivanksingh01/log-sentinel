
# Log-Based Intrusion Detection Backend  
## Final Consolidated Approach, Architecture, API Design, Folder Structure, and Implementation Plan

---

# 1) Final Problem Understanding

Build a backend service that continuously analyzes application or web server logs to detect suspicious or abusive behavior while minimizing false positives.

The system must:

- accept logs through a mounted directory such as `/logs`
- continuously process newly appended log entries
- detect suspicious patterns using backend logic
- generate alerts
- expose alerts through logs and HTTP APIs
- run locally with Docker
- listen on **port 8080**
- demonstrate **correctness, trade-offs, observability, and debuggability**

---

# 2) Final Engineering Interpretation

This should be treated as a **small real-time intrusion / abuse detection backend**, not just a file parser.

The backend should:

- ingest logs from mounted files
- optionally generate its own logs through demo APIs
- parse them into normalized events
- run rule-based detection
- create structured alerts
- expose alerts via:
  - REST APIs
  - console logs
  - SSE stream
- optionally send notifications for high-severity incidents

This creates a complete and demo-friendly backend system.

---

# 3) Recommended Final Scope (Best Balance for Assignment)

## Must Build
- `/logs` folder watcher / tail reader
- startup scan of existing logs
- structured log parser
- normalized event model
- rule-based intrusion detection engine
- alert generation with severity
- alert deduplication / cooldown
- in-memory alert store
- REST APIs for alerts, summary, health, stats
- SSE endpoint for real-time alerts
- Docker support
- sample/demo traffic generation

## Good Optional Additions
- MongoDB persistence for alerts/events
- webhook notifications
- email notifications for HIGH severity only
- log ingestion endpoint
- synthetic attack scripts

---

# 4) Final Architecture

```text
Mounted Logs (/logs) + Demo APIs
                ↓
         Log Producer Layer
                ↓
       File Watcher / Tail Reader
                ↓
             Log Parser
                ↓
        Normalized Event Pipeline
                ↓
       Rule-Based Detection Engine
                ↓
            Alert Generator
                ↓
    ┌────────────┼─────────────┬──────────────┐
    ↓            ↓             ↓              ↓
 Memory Store  Console Logs   MongoDB      Notification Layer
                                             ├─ Webhook
                                             └─ Email (HIGH only)
                ↓
         REST API + SSE Stream
```

---

# 5) Final Technical Stack Recommendation

## Recommended Stack
- **Node.js**
- **TypeScript**
- **Express**
- **MongoDB (optional but recommended)**
- **Docker**
- **SSE for streaming**
- **Resend (optional for email)**

## Why this stack
This is ideal for:
- fast implementation
- strong backend architecture
- easy Dockerization
- good interview readability
- clean separation of modules

---

# 6) Core System Flow

## Step-by-step system flow

### Step 1 — Logs arrive
Logs can come from:
- mounted files in `/logs`
- internal demo APIs that write to `/logs`
- optional manual HTTP ingestion

### Step 2 — File watcher detects new lines
The watcher:
- scans files on startup
- watches for appended lines
- tracks file offsets
- avoids duplicate processing

### Step 3 — Parser converts raw lines to structured events
Each log line is transformed into a normalized event object.

### Step 4 — Detection engine evaluates rules
Each event is checked against multiple security / abuse detection rules.

### Step 5 — Alert service creates structured alerts
When a rule matches:
- generate alert
- assign severity
- attach evidence
- deduplicate if needed

### Step 6 — Alert is surfaced
Alert is:
- stored in memory
- printed to console
- optionally persisted to MongoDB
- streamed via SSE
- optionally sent via webhook/email

### Step 7 — APIs expose system state
The user can inspect:
- alerts
- recent alerts
- summaries
- stats
- health
- live alert stream

---

# 7) Input Log Strategy

The system should support **two ingestion modes**.

## Mode A — Mounted Log Files (Primary Requirement)
The assignment explicitly requires:
- accept logs from `/logs`

### Example mounted run
```bash
docker run -p 8080:8080 -v $(pwd)/logs:/logs intrusion-detector
```

---

## Mode B — Internal Log-Generating APIs (Strong Demo Feature)
Add APIs that generate realistic logs.

This makes the system:
- testable
- reproducible
- demo-friendly

---

# 8) Final Log Format

Use a **simple structured text log format** that is easy to parse.

## Example log lines

```text
2026-04-06T12:00:00Z event=FAILED_LOGIN ip=1.2.3.4 user=admin path=/auth/login status=401
2026-04-06T12:00:05Z event=FAILED_LOGIN ip=1.2.3.4 user=admin path=/auth/login status=401
2026-04-06T12:00:08Z event=LOGIN_SUCCESS ip=1.2.3.4 user=admin path=/auth/login status=200
2026-04-06T12:00:10Z event=REQUEST ip=5.5.5.5 path=/products method=GET status=200
2026-04-06T12:00:12Z event=REQUEST ip=5.5.5.5 path=/admin method=GET status=403
```

---

# 9) Normalized Event Model

Every raw log line should be parsed into one common internal event format.

## Example normalized event

```json
{
  "timestamp": "2026-04-06T12:00:00Z",
  "eventType": "FAILED_LOGIN",
  "ip": "1.2.3.4",
  "user": "admin",
  "path": "/auth/login",
  "method": "POST",
  "status": 401,
  "raw": "2026-04-06T12:00:00Z event=FAILED_LOGIN ip=1.2.3.4 user=admin path=/auth/login status=401"
}
```

## Why normalization matters
This allows all detection rules to operate on one common structure regardless of input source.

---

# 10) Detection Strategy

Use **rule-based detection**, not AI/ML.

## Why rule-based is the correct choice here
It is:
- explainable
- deterministic
- testable
- low-risk
- easier to debug

This assignment rewards **engineering clarity**, not model complexity.

---

# 11) Final Detection Rules

Implement **5 strong rules** only.

This is the best trade-off between quality and time.

---

# 11.1 Rule 1 — Brute Force Detection

## Logic
If the same IP causes too many failed login attempts in a short time window, raise an alert.

## Example threshold
- `5 failed logins`
- within `60 seconds`

## Example alert type
`BRUTE_FORCE_LOGIN`

---

# 11.2 Rule 2 — Credential Stuffing Detection

## Logic
If the same IP attempts many different usernames within a short time window, raise an alert.

## Example threshold
- `5 different usernames`
- within `60 seconds`

## Example alert type
`CREDENTIAL_STUFFING`

---

# 11.3 Rule 3 — Distributed Attack on One Account

## Logic
If one username receives failed login attempts from many different IPs in a short time, raise an alert.

## Example threshold
- `5 distinct IPs`
- targeting same username
- within `60 seconds`

## Example alert type
`DISTRIBUTED_ACCOUNT_ATTACK`

---

# 11.4 Rule 4 — Fail-Then-Success (Possible Compromise)

## Logic
If multiple failed logins are followed by a successful login for the same IP/user in a short time, raise a **HIGH severity** alert.

## Why important
This is one of the strongest signals of possible compromise.

## Example alert type
`POSSIBLE_COMPROMISE`

---

# 11.5 Rule 5 — Request Abuse / Rate Spike

## Logic
If one IP generates too many requests within a short time, raise an alert.

## Example threshold
- `100 requests`
- within `60 seconds`

## Example alert type
`REQUEST_ABUSE`

---

# 12) False Positive Reduction Strategy

This is one of the most important parts of the assignment.

## Measures used to reduce false positives

### A. Threshold-based alerts
Do not alert on single failures.

### B. Sliding time windows
Evaluate behavior only in recent time windows.

### C. Multi-event correlation
Use sequences or patterns instead of isolated events.

### D. Alert deduplication
Suppress repeated alerts for the same issue.

### E. Severity classification
Not every suspicious event is HIGH severity.

---

# 13) Alert Severity Model

## Severity Levels
- `LOW`
- `MEDIUM`
- `HIGH`

## Suggested mapping

### LOW
- light request abuse

### MEDIUM
- brute force
- credential stuffing
- distributed account attack

### HIGH
- fail-then-success compromise pattern

---

# 14) Final Alert Object Design

Every alert should be a structured object.

## Example alert JSON

```json
{
  "id": "alert_001",
  "type": "POSSIBLE_COMPROMISE",
  "severity": "HIGH",
  "ip": "1.2.3.4",
  "user": "admin",
  "message": "Multiple failed logins followed by successful login",
  "evidence": {
    "failedAttempts": 6,
    "windowSeconds": 60
  },
  "createdAt": "2026-04-06T12:00:45Z",
  "dedupeKey": "POSSIBLE_COMPROMISE:1.2.3.4:admin"
}
```

---

# 15) Alert Deduplication / Cooldown

## Problem
Without deduplication, repeated events will create noisy duplicate alerts.

## Solution
Use:
- `dedupeKey`
- `cooldown window`

## Example
Only allow one alert per:

```text
(BRUTE_FORCE_LOGIN, ip=1.2.3.4) every 5 minutes
```

## Benefit
This reduces:
- alert spam
- duplicate noise
- email/webhook flooding

---

# 16) Alert Surfacing Layers

Use **3 levels of alert surfacing**.

---

# 16.1 Layer 1 — In-Memory Alert Store

Store all active/generated alerts in memory.

## Used for
- API responses
- SSE streaming
- runtime inspection

---

# 16.2 Layer 2 — Console Logging

Print every alert to console.

## Example
```text
[ALERT][HIGH][POSSIBLE_COMPROMISE] ip=1.2.3.4 user=admin failedAttempts=6
```

## Why useful
- good observability
- easy demo
- easy debugging

---

# 16.3 Layer 3 — HTTP APIs

Expose alerts through REST endpoints.

This makes the service:
- testable
- inspectable
- integration-ready

---

# 17) Persistence Strategy

## Recommended final choice
Use **in-memory first**, with **MongoDB as optional persistence**.

---

## What to persist

### `alerts` collection
Store all generated alerts.

### `events` collection (optional)
Store parsed events for:
- replay
- audit
- debugging

---

# 18) Notification Strategy (Optional but Strong)

Notifications should be **non-blocking** and **best-effort**.

## Channels

### A. Webhook
When alert is created:
- POST alert payload to configured webhook

### B. Email (HIGH severity only)
If:
```text
alert.severity === HIGH
```
send email asynchronously using Resend.

## Important requirements
- never block detection flow
- never crash app if notification fails
- optionally rate-limit repeated sends

---

# 19) Real-Time Alert Streaming (SSE)

Implement:

```http
GET /alerts/stream
```

This should stream alerts as they happen.

## Example usage
```bash
curl -N http://localhost:8080/alerts/stream
```

## Example SSE output
```text
event: alert
data: {"type":"POSSIBLE_COMPROMISE","severity":"HIGH","ip":"1.2.3.4"}
```

This is one of the strongest “real-time backend” features in the project.

---

# 20) Final API Design

Below is the clean final API surface.

---

# 20.1 Demo / Log-Producing APIs

These APIs generate logs and help simulate realistic traffic.

---

## `POST /auth/login`

### Purpose
Simulate login attempts.

### Request
```json
{
  "username": "admin",
  "password": "wrong"
}
```

### Behavior
- wrong password → log `FAILED_LOGIN`
- correct password → log `LOGIN_SUCCESS`

### Response (failure)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Response (success)
```json
{
  "success": true,
  "message": "Login successful"
}
```

---

## `GET /products`

### Purpose
Simulate normal traffic.

### Response
```json
{
  "items": [
    { "id": 1, "name": "Laptop" },
    { "id": 2, "name": "Phone" }
  ]
}
```

---

## `GET /admin`

### Purpose
Simulate restricted access attempts.

### Response
```json
{
  "message": "Forbidden"
}
```

Status:
```http
403 Forbidden
```

---

## `POST /logs/ingest` (Optional)

### Purpose
Allow direct manual log injection for testing.

### Request
```json
{
  "line": "2026-04-06T12:00:00Z event=FAILED_LOGIN ip=1.2.3.4 user=admin path=/auth/login status=401"
}
```

### Response
```json
{
  "accepted": true
}
```

---

# 20.2 Alert APIs

---

## `GET /alerts`

### Purpose
Fetch alerts.

### Query Params
- `severity`
- `type`
- `limit`

### Example
```http
GET /alerts?severity=HIGH&type=POSSIBLE_COMPROMISE&limit=10
```

### Example response
```json
[
  {
    "id": "alert_001",
    "type": "POSSIBLE_COMPROMISE",
    "severity": "HIGH",
    "ip": "1.2.3.4",
    "user": "admin",
    "message": "Multiple failed logins followed by successful login",
    "createdAt": "2026-04-06T12:00:45Z"
  }
]
```

---

## `GET /alerts/latest`

### Purpose
Fetch most recent alerts.

### Example response
```json
[
  {
    "id": "alert_010",
    "type": "BRUTE_FORCE_LOGIN",
    "severity": "MEDIUM",
    "ip": "2.2.2.2",
    "user": "root",
    "createdAt": "2026-04-06T12:10:45Z"
  }
]
```

---

## `GET /alerts/summary`

### Purpose
Fetch aggregated alert summary.

### Example response
```json
{
  "totalAlerts": 8,
  "byType": {
    "BRUTE_FORCE_LOGIN": 3,
    "CREDENTIAL_STUFFING": 2,
    "POSSIBLE_COMPROMISE": 3
  },
  "bySeverity": {
    "LOW": 1,
    "MEDIUM": 4,
    "HIGH": 3
  }
}
```

---

## `GET /alerts/stream`

### Purpose
SSE endpoint for live alert streaming.

### Output
Streams alert events in real time.

---

# 20.3 System APIs

---

## `GET /stats`

### Purpose
Expose internal pipeline metrics.

### Example response
```json
{
  "logsProcessed": 1245,
  "filesWatched": 3,
  "parseErrors": 4,
  "alertsCreated": 8,
  "alertsSuppressed": 12,
  "emailsSent": 2,
  "webhooksAttempted": 5
}
```

---

## `GET /health`

### Purpose
Basic liveness/readiness endpoint.

### Example response
```json
{
  "status": "ok",
  "uptimeSeconds": 1234
}
```

---

# 21) Final Folder Structure

This is the recommended clean backend structure.

```text
intrusion-detector/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── detectionConfig.ts
│   │
│   ├── db/
│   │   └── mongo.ts
│   │
│   ├── routes/
│   │   ├── app.routes.ts
│   │   ├── alert.routes.ts
│   │   └── system.routes.ts
│   │
│   ├── controllers/
│   │   ├── app.controller.ts
│   │   ├── alert.controller.ts
│   │   └── system.controller.ts
│   │
│   ├── services/
│   │   ├── logWriter.service.ts
│   │   ├── watcher.service.ts
│   │   ├── parser.service.ts
│   │   ├── detection.service.ts
│   │   ├── state.service.ts
│   │   ├── alert.service.ts
│   │   ├── summary.service.ts
│   │   └── sse.service.ts
│   │
│   ├── notifications/
│   │   ├── notification.service.ts
│   │   ├── emailNotifier.ts
│   │   ├── webhookNotifier.ts
│   │   └── consoleNotifier.ts
│   │
│   ├── models/
│   │   ├── Alert.ts
│   │   └── Event.ts
│   │
│   ├── rules/
│   │   ├── bruteForce.rule.ts
│   │   ├── credentialStuffing.rule.ts
│   │   ├── distributedAttack.rule.ts
│   │   ├── failThenSuccess.rule.ts
│   │   └── requestAbuse.rule.ts
│   │
│   └── utils/
│       ├── logger.ts
│       ├── time.ts
│       └── ip.ts
│
├── scripts/
│   ├── generate-normal-traffic.ts
│   ├── generate-bruteforce.ts
│   ├── generate-credential-stuffing.ts
│   ├── generate-distributed-attack.ts
│   ├── generate-compromise.ts
│   └── generate-mixed-traffic.ts
│
├── logs/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── README.md
├── assumptions.md
└── todo.md
```

---

# 22) Route Grouping (Clean Design)

Use 3 route groups only.

---

# 22.1 App Routes
Used to generate logs / simulate traffic.

## Routes
- `POST /auth/login`
- `GET /products`
- `GET /admin`
- `POST /logs/ingest` (optional)

---

# 22.2 Alert Routes
Used to inspect alerts.

## Routes
- `GET /alerts`
- `GET /alerts/latest`
- `GET /alerts/summary`
- `GET /alerts/stream`

---

# 22.3 System Routes
Used for health and observability.

## Routes
- `GET /stats`
- `GET /health`

---

# 23) Recommended Internal Services

These services keep the codebase clean and modular.

---

## `watcher.service.ts`
Responsible for:
- scanning `/logs`
- tracking file offsets
- reading appended lines

---

## `parser.service.ts`
Responsible for:
- parsing raw lines
- validating fields
- normalizing event objects

---

## `detection.service.ts`
Responsible for:
- running rules
- coordinating detection logic

---

## `state.service.ts`
Responsible for:
- tracking rolling windows
- maintaining counters
- storing recent per-IP / per-user behavior

---

## `alert.service.ts`
Responsible for:
- generating alerts
- deduplication
- persistence
- broadcasting

---

## `summary.service.ts`
Responsible for:
- alert summary
- stats aggregation

---

## `sse.service.ts`
Responsible for:
- managing SSE clients
- pushing real-time alerts

---

# 24) Suggested MongoDB Collections

If MongoDB is included, use these collections.

---

## `alerts`
Store generated alerts.

## `events` (optional)
Store parsed events.

## `notification_logs` (optional)
Store email/webhook attempts.

---

# 25) Suggested Detection Configuration

Keep thresholds configurable.

## Example config

```ts
export const detectionConfig = {
  bruteForce: {
    threshold: 5,
    windowSec: 60,
    cooldownSec: 300
  },
  credentialStuffing: {
    threshold: 5,
    windowSec: 60,
    cooldownSec: 300
  },
  distributedAttack: {
    threshold: 5,
    windowSec: 60,
    cooldownSec: 300
  },
  possibleCompromise: {
    failedThreshold: 5,
    windowSec: 120,
    cooldownSec: 300
  },
  requestAbuse: {
    threshold: 100,
    windowSec: 60,
    cooldownSec: 120
  }
};
```

This makes the solution much more production-minded.

---

# 26) Observability / Debuggability Strategy

The assignment explicitly values observability.

So include the following:

## A. Structured application logs
Print useful logs for:
- startup
- file watcher events
- parser errors
- alerts generated
- notification attempts

## B. Internal counters
Track:
- files watched
- logs processed
- parse failures
- alerts created
- alerts suppressed
- emails sent
- webhooks attempted

## C. Clear alert reasons
Every alert should explain:
- why it was generated
- what evidence triggered it

This is a major strength of the solution.

---

# 27) Suggested Demo Scripts

These scripts make the project highly demoable.

---

## `generate-normal-traffic.ts`
Produces harmless traffic.

## `generate-bruteforce.ts`
Produces repeated failed login attempts from same IP.

## `generate-credential-stuffing.ts`
Produces one IP trying many usernames.

## `generate-distributed-attack.ts`
Produces many IPs targeting one username.

## `generate-compromise.ts`
Produces multiple failures followed by success.

## `generate-mixed-traffic.ts`
Produces realistic mixed traffic.

---

# 28) Recommended Step-by-Step Build Plan

This is the cleanest implementation order.

---

# Phase 1 — Base Setup
- initialize Node + TypeScript project
- setup Express server
- add Docker support
- add `/health`

---

# Phase 2 — Log Ingestion
- create `/logs`
- build watcher service
- add startup file scan
- implement offset tracking

---

# Phase 3 — Parsing
- build parser service
- normalize event structure
- add parser error handling

---

# Phase 4 — Detection Engine
- implement rolling state store
- add 5 rules
- add severity mapping

---

# Phase 5 — Alerting
- build alert service
- add dedupe / cooldown
- print alerts to console
- store in memory

---

# Phase 6 — APIs
- add:
  - `/alerts`
  - `/alerts/latest`
  - `/alerts/summary`
  - `/stats`
  - `/health`

---

# Phase 7 — Real-Time Streaming
- implement SSE at `/alerts/stream`

---

# Phase 8 — Demo Traffic
- add:
  - `/auth/login`
  - `/products`
  - `/admin`
- add generator scripts

---

# Phase 9 — Optional Enhancements
- MongoDB persistence
- webhook notifications
- Resend email integration

---

# 29) Final Trade-Offs To Mention in Submission

These are important to explicitly mention in README / assumptions.

## Trade-offs chosen

### 1. Rule-based detection instead of ML
Chosen for:
- explainability
- correctness
- deterministic behavior

### 2. File offset polling / tailing over complex stream infra
Chosen for:
- simplicity
- Docker-friendliness
- reliability

### 3. In-memory state for real-time detection
Chosen for:
- low complexity
- fast implementation

MongoDB is used only for persistence, not core runtime detection.

### 4. SSE instead of WebSockets
Chosen for:
- simpler real-time push
- one-way streaming is sufficient for alerts

### 5. Email only for HIGH severity
Chosen to:
- reduce noise
- avoid alert fatigue

---

# 30) Final Assumptions To Document

Put these in `assumptions.md`.

## Assumptions
- log files are append-only
- log lines follow known structured format
- mounted `/logs` directory is readable
- timestamps are trusted
- detection is heuristic and not exhaustive
- this is a local/demo intrusion detection backend, not a production SOC platform

---

# 31) Final TODOs To Document

Put these in `todo.md`.

## Suggested TODOs
- support file rotation
- add replay mode for historical logs
- add Prometheus metrics
- add rate limiting for notification channels
- add alert acknowledgment workflow
- add IP reputation enrichment
- add user / tenant awareness
- add unit and integration test coverage
- add persistent rolling state storage
- add multi-file format support (nginx/apache/json)

---

# 32) Final One-Line Summary

> A self-contained backend service that continuously analyzes real-time and static logs, detects suspicious behavior using rule-based analytics, generates structured alerts, and exposes them through APIs, console logs, SSE streams, and optional notification channels.

---

# 33) Final Recommendation

For the assignment, the **best final submission** is:

- clean architecture
- strong README
- 5 good rules
- working APIs
- SSE live alerts
- demo traffic generation
- Docker run success

That is more valuable than overbuilding many incomplete features.
