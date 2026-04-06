# 🛡️ Log Sentinel

**A production-grade Log-Based Intrusion Detection System (IDS) built on Node.js + Express.**

Log Sentinel continuously monitors a mounted `/logs` directory, dynamically parsing security events in real time. It leverages a resilient fallback parser that can handle *any unstructured text log format* as well as structured KV pairs. Events are evaluated instantly against **10 independent detection rules** covering common application-layer attack patterns. Alerts are surfaced via REST APIs, a live Server-Sent Events (SSE) stream, and simulated Email/Webhook notifications.

---

## 🎯 Detection Coverage

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

## 🚀 Step-by-Step Guide (For Absolute Beginners)

You don't need any prior knowledge to run this. Follow these steps to get your intrusion detection system up and running instantly.

### Option A — Run with Docker (Recommended the Easiest Way)

Docker will automatically handle all dependencies, isolate the environment, and run the server.

1. **Install Docker:** Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. **Open your Terminal (or Command Prompt / PowerShell)**
3. **Navigate to this project folder:**
   ```bash
   cd log-sentinel
   ```
4. **Build the Docker Image:** (This packages the code into an executable container)
   ```bash
   docker build -t intrusion-detector .
   ```
5. **Start the Scanner:** (This mounts the `logs` folder so the scanner can read files dropped into it)
   
   *If using Git Bash / Linux / macOS:*
   ```bash
   docker run -p 8080:8080 -v "$(pwd)/logs:/logs" intrusion-detector
   ```
   *If using Windows PowerShell:*
   ```powershell
   docker run -p 8080:8080 -v "${PWD}/logs:/logs" intrusion-detector
   ```

**What exactly is happening now?** 
The server is running on `http://localhost:8080`. It is actively watching the `logs/` folder on your computer. If you drop a text file named `test.txt` into that `logs/` folder and it contains a malicious payload like `192.168.1.99 GET /../../../etc/passwd`, the scanner will immediately catch it.

---

### Option B — Run Locally (For Developers)

If you have Node.js installed and want to run it natively without Docker:

1. **Install Node.js (v20+)**
2. **Open Terminal** in the project folder.
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Setup Configuration:**
   ```bash
   cp .env.example .env
   ```
5. **Start the Engine:**
   ```bash
   npm start
   ```

---

## 📡 Live Stream: How to Connect to Real-Time Alerts (SSE)

Server-Sent Events (SSE) allows the server to push alerts to you the *second* an attack happens. You don't have to refresh the page.

**Option 1: Watch in your Browser (Easiest)**
Simply open your web browser and go to:  
`http://localhost:8080/api/v1/alerts/stream`  
*Keep this tab open. When an attack is detected, a new text line will instantly appear here.*

**Option 2: Watch in Terminal**
Leave this command running in a separate terminal:
```bash
curl -N http://localhost:8080/api/v1/alerts/stream
```
*Output will look like this the moment a hacker strikes:*
```json
data: {"id":"alert_001","type":"SQL_INJECTION_PROBE","severity":"HIGH","ip":"5.5.5.5"}
```

---

## 📧 When are Emails Triggered?

Log Sentinel does not spam your inbox for every minor anomaly. Emails are simulated/triggered exclusively under **HIGH severity** conditions.

**An Email is dispatched immediately when:**
1. A **Signature Attack** is detected (e.g., SQL Injection, Path Traversal). Let's say an attacker tries to access `/etc/passwd`.
2. A **Behavioral Escalation** occurs. For example, if an attacker brute forces an account (`MEDIUM` severity) and then suddenly logs in successfully. This escalates to a `POSSIBLE_COMPROMISE` (`HIGH` severity).
3. A **Malicious Scanner** (like Nikto or Dirbuster) is detected rapidly probing your critical paths.

*Note: In this assignment, the email is logged to the console safely (`[EMAIL] Sent HIGH severity alert...`) rather than actually hitting an external SMTP server.*

---

## 🕹️ Test It Now (Generate Attacks)

To see the system in action, open a new terminal window while the server is running.

**1. Automated 10-Scenario Attack Simulation:**
This script will fire real HTTP requests and inject direct logs to simulate 10 different attacks. Watch your SSE stream log them as they hit!
```bash
node scripts/simulate-attacks.js
```

**2. Inject a Malicious Log Manually:**
Just append text directly into ANY `.txt` or `.log` file in the `logs/` directory. The fallback parser will catch unstructured logs as long as there is an IP and an attack signature!
```bash
echo "192.168.1.99 tried to SELECT * FROM users UNION" >> logs/test.txt
```

---

## 🔌 API Routes Cheatsheet

| HTTP Method | API Endpoint | What it does | 
|---|---|---|
| `GET` | `/api/v1/health` | **Ping the server.** Returns `{"status":"UP"}` to let you know it's alive. |
| `GET` | `/api/v1/alerts` | **Get all alerts.** Perfect for an admin dashboard. Supports query filtering like `?severity=HIGH`. |
| `GET` | `/api/v1/alerts/latest`| **Get the 10 newest alerts.** |
| `GET` | `/api/v1/alerts/summary`| **View an aggregation.** Shows total threat counts organized by type and severity. |
| `GET` | `/api/v1/alerts/stream` | **Live Web Stream (SSE).** Attach to this to get constant push notifications of attacks. |
| `GET` | `/api/v1/stats` | **View System Processing Stats.** Shows how many log lines were parsed successfully vs failed. |

**Example API Request:**
```bash
curl http://localhost:8080/api/v1/alerts/summary
```

---

## 🏗️ Architecture

```text
                         ┌─────────────────────────────┐
  Any Application   ─── ▶│    /logs (mounted volume)    │
  (nginx, syslog, app)   │  [ .txt, .log, .csv, etc ]  │
                         └────────────┬────────────────┘
                                      │ fs.watch + dynamic tailing
                                      ▼
                         ┌─────────────────────────────┐
                         │     Watcher Service          │
                         │  (tracks offsets, ignores    │
                         │   internal rotators)         │
                         └────────────┬────────────────┘
                                      │ raw log line
                                      ▼
                         ┌─────────────────────────────┐
                         │     Parser Service           │
                         │ Tries structured key=value,  │
                         │ falls back to regex IP scan  │
                         └────────────┬────────────────┘
                                      │ normalized or RAW_LOG event
                                      ▼
                         ┌─────────────────────────────┐
                         │     Detection Engine         │◀── State Service (in-memory)
                         │  10 rules evaluated hourly   │
                         └────────────┬────────────────┘
                                      │ alert payload
                                      ▼
                         ┌─────────────────────────────┐
                         │     Alert Service            │
                         │  Deduplication / cooldown    │
                         └────┬──────────┬─────────────┘
                              │          │
                    ┌─────────▼──┐  ┌────▼──────────────┐
                    │ SSE Stream │  │  Multi-Transport  │
                    │ (live push)│  │  (Email, Hooks,   │
                    └────────────┘  │  Persisted NDJSON)│
                                    └────────────────────┘
```

---

## 📁 File Structure

Here is where the magic happens if you want to explore the source code:

```text
log-sentinel/
├── src/
│   ├── rules/                    # 🧠 The brains. Each file is a distinct attack signature.
│   │   ├── bruteForce.rule.js
│   │   ├── sqliProbe.rule.js     # Detects SQL injection.
│   │   └── ...                   # (8 other rules)
│   ├── services/                 # ⚙️ The engine.
│   │   ├── alert.service.js      # Decides if an alert is a duplicate.
│   │   ├── detection.service.js  # Runs events through all the rules.
│   │   ├── parser.service.js     # Parses ugly strings into clean JSON models.
│   │   ├── watcher.service.js    # Listens for file changes in the /logs directory.
│   │   └── sse.service.js        # Manages the live web stream pushing.
│   ├── notifications/            # 📧 Where webhook and email triggers live.
│   ├── persistence/              # 💾 Where alerts are saved to disk.
│   └── app.js & server.js        # 🚀 Starts the Express API server.
├── scripts/
│   └── simulate-attacks.js       # 🕹️ Generates synthetic data for testing.
├── logs/                         # 📁 Drop files here to be scanned.
├── data/                         # 📁 Saved outputs (NDJSON) live here.
├── Dockerfile                    # 🐳 Container instructions.
├── assumptions.md                # 💭 Design logic and boundaries.
└── todo.md                       # 📋 Enhancements mapped for production.
```

---

## 🤔 Engineering Trade-offs & Alternatives

1. **In-Memory Offset Tracking vs Persistent State**: 
   *Trade-off*: Log file byte offsets (for deduplicated reading) and anomaly sliding windows are kept in-memory. If the container restarts cleanly, they are wiped.
   *Reasoning*: Time-boxed anomalies lose value quickly. Opting for no external MongoDB/Redis dependency radically reduced configuration sprawl and kept the architecture pure and standalone.
2. **Regex IP Fallback vs Strict Schema Logging**:
   *Trade-off*: The parser supports a strict schema (`event=TYPE ip=...`), but falls back to aggressively capturing any IPv4 regex. 
   *Reasoning*: While this risks categorizing internal generic errors as "raw payloads," it allows the IDS to scan *any* legacy unformatted log files blindly dropped into `/logs` for traversal and SQLi signatures.
3. **NDJSON File Appends vs Database**:
   *Trade-off*: Alerts are persisted linearly into a basic `data/alerts.json` NDJSON array. No complex query capabilities.
   *Reasoning*: Enables correctness under failure—disk full or crash won't corrupt a B-Tree structure, and you can pipe NDJSON easily to Logstash without overhead.
