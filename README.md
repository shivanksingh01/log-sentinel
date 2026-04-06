# Log Sentinel

A production-grade Intrusion Detection System (IDS) and log analysis platform built on Node.js and Express.

## Features Overview

1. **Log Ingestion**: Monitors system log files (`/logs`) in real-time, reading new entries via a custom `watcher.service` that tracks byte offsets.
2. **Parsing Layer**: Normalizes disparate unstructured log lines into structured events via `parser.service`.
3. **Detection Engine**: Correlates events using state tracking (`state.service`) combined with customizable rules (`bruteForce`, `credentialStuffing`, etc.) to trigger alerts with intelligent deduplication capabilities.
4. **Real-time Streaming**: Provides a live Sever-Sent Events (SSE) feed (`/api/v1/alerts/stream`) to instantly push alerts to operations web consoles or downstream clients without the need to poll.
5. **REST Alert Management**: Retrieve, filter, and summarize triggered intrusion alerts via standard JSON APIs.
6. **Persistence & Notifications**: Optionally writes alerts to disk using NDJSON (`/data/alerts.json`), issues webhook posts to external integrators, and acts on simulated emails for `HIGH` severity alerts (non-blocking and failure-safe).

## Engineering Principles
- **No Blocking IO**: All file ingestion, streaming connections, and notification services run efficiently without stalling the main Node.js event loop.
- **Fail-safe Integrations**: Persistence and notifications are optional enhancements added without introducing mandatory external dependencies, ensuring high resiliency.
- **Deduplication**: Intelligent time-based deduplication limits burst alerts to operators during major attacks.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development:
   ```bash
   npm run dev
   ```

3. Run in production:
   ```bash
   npm start
   ```

## Routes & APIs

- `GET /api/v1/health` - Basic health check.
- `POST /api/v1/logs/ingest` - Manually push log events via API.
- `GET /api/v1/alerts` - Retrieve current intrusion alerts. Supported query parameters: `severity`, `type`, `limit`.
- `GET /api/v1/alerts/summary` - Retrieve statistical counts by alert type and severity.
- `GET /api/v1/alerts/stream` - Persistent SSE connection pushing JSON alert lines live.

## Implementation Steps Docs
For isolated module details, please review the respective milestone documentation in the `/docs` directory.
- Step 1: Base Boilerplate
- Step 2: Log Ingestion Foundation
- Step 3: Parsing Engine
- Step 4: Detection Engine Core
- Step 5: Real-time SSE / REST APIs
- Step 6: File Persistence & Ext. Notifications
