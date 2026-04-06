# High-Level Design (HLD) - Log Sentinel

## 1. Project Overview
Log Sentinel is a production-ready Intrusion Detection System (IDS) and Log Analysis backend built strictly with Node.js and Express. It ingests flat-file logs in real-time, parses security events asynchronously, evaluates them against behavioral rules, and pushes critical intrusion alerts to connected clients using Server-Sent Events (SSE) alongside webhooks and email integrations.

The architecture emphasizes **minimal external dependencies** and uses asynchronous I/O streams entirely, avoiding blocking the main Node.js event pool even under heavy log ingestion traffic.

---

## 2. System Architecture & Data Flow

```text
+-------------------+       (1. Writes via API)      +--------------------+
| Application Mocks |  ----------------------------> |  logs/app.log      |
+-------------------+                                +--------------------+
                                                              |
                                                              | (2. Tail / Watch)
                                                              v
+-------------------+                                +--------------------+
|   REST APIs       | <--- (6. Summaries/Poll) ----- | Watcher Service    |
+-------------------+                                +--------------------+
       ^                                                      |
       | (7. Data Push)                                       | (3. Raw Line Chunk)
       |                                                      v
+-------------------+    (4. Normalizes Strings)     +--------------------+
|   SSE Endpoints   | <----------------------------- | Processor & Parser |
+-------------------+                                +--------------------+
                                                              |
                                                              | (5. Structured Event)
                                                              v
+-------------------+    (8. Storage/Webhooks)       +--------------------+
|  Persistence &    | <----------------------------- | Detection Engine & |
|  Notifications    |                                | Alert Service      |
+-------------------+                                +--------------------+
```

---

## 3. Core Components

### 3.1. Ingestion Layer (`watcher.service.js` & `logProcessor.service.js`)
Responsible for reading the raw `app.log` without locking the file. It tracks the last read byte offset. When new bytes are written, it streams the partial chunk, splits it by newline `\n`, and passes raw string formats to the log processor.

### 3.2. Parser Layer (`parser.service.js`)
Accepts raw strings and applies Regular Expression matching to extract fields. Typical components include Timestamp, Log Level, Event Name, and Message format. It returns a normalized `Event` object regardless of how the raw log looked.

### 3.3. Detection Engine (`detection.service.js` & `state.service.js`)
Acting as the brain, it routes the parsed events against a series of heuristics (Rules). For example, it tracks failed logins against `state.service.js`. If an IP address fails 5 times, it generates a `BRUTE_FORCE` alert object.

### 3.4. Alerting & Streaming (`alert.service.js` & `sse.service.js`)
Maintains an active registry of triggered alerts. Applies cooldown-based deduplication limiting the same alert spam. It then emits a Node.js event listened to by the SSE service, which streams it over open long-lived HTTP connections to any live web consoles.

### 3.5. Persistence & Notifications Layer (`fileStore.service.js` & `notification.service.js`)
Writes final processed alerts structurally into `/data/alerts.json` (NDJSON format). Asynchronously propagates the payload to external system Webhooks and emails administrators if the severity evaluates symmetrically to `HIGH`. Failure in this layer gracefully continues executing without stopping the detection flow.

---

## 4. Technical Stack
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Real-Time Integration**: Server-Sent Events (SSE)
- **External Integration Tooling**: Native `Fetch` API, `fs/promises`
- **Security / Boilerplate**: Helmet, Cors, Express-Rate-Limit
