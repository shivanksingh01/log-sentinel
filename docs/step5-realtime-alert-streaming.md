# Step 5: Real-Time Alert Streaming (SSE) + Enhanced Alert APIs + Operator Visibility

## Overview
Implemented real-time alert delivery capability to enable live visibility of generated alerts from the detection engine, without needing to repeatedly poll the API. This feature transforms the event-driven parsing and detection system into a live operational monitoring platform using Server-Sent Events (SSE).

## Files Created / Updated
- `src/services/sse.service.js`: Added an SSE state manager tracking active client connections and providing real-time alert event broadcasting.
- `src/routes/alert.routes.js`: Registered `GET /api/v1/alerts/stream` to initiate SSE client connections.
- `src/controllers/alert.controller.js`: Managed SSE stream headers and connections. Also added filtering capabilities (`severity`, `type`, `limit`) to the `getAllAlerts` endpoint.
- `src/services/alert.service.js`: Integrated the SSE service to continuously broadcast live alerts immediately after log insertion. Implemented query filtering on alert retrievals.

## Key Features
1. **Server-Sent Events (SSE) stream endpoint:**
   - Long-lived connection.
   - Pushes standard SSE messages format (`event: alert \n data: <payload>`).
   - Connected clients receive instant notification when the detection engine identifies a brute force or credential stuffing attempt.
2. **Client Management:**
   - Unique connection IDs.
   - Robust connect/disconnect capability gracefully removing clients when streams are closed.
   - Optional keep-alive (heartbeat/ping) implementation to maintain idle connections.
3. **Advanced Alerts Retrieval:**
   - Operators can now filter alerts efficiently using query parameters like `?severity=HIGH&type=POSSIBLE_COMPROMISE` on the `/alerts` REST endpoint.

## Usage Verification
To test live Streaming capabilities, start the dev server and use `curl` to watch the event stream:

```bash
# Keep this connection open in one terminal
curl -N http://localhost:5000/api/v1/alerts/stream
```

In another terminal, trigger a `BRUTE_FORCE_LOGIN` alert:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username": "admin", "password": "wrong"}'
```

After repeating the above POST request multiple times, the active stream should display the real-time push:

```text
event: alert
data: {"id":"alert_001","type":"BRUTE_FORCE_LOGIN","severity":"MEDIUM","ip":"::ffff:127.0.0.1","user":"admin","message":"...","createdAt":"..."}
```

Other API enhancements available:
- `GET /api/v1/alerts?severity=MEDIUM`
- `GET /api/v1/alerts?limit=5`
- `GET /api/v1/alerts/latest`
- `GET /api/v1/alerts/summary`

## Next Steps
Future integrations will build on this strong live alerting event-pipeline to trigger notifications, webhooks, and potentially external persistent storage endpoints to establish high-scale infrastructure preparedness.
