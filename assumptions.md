# Assumptions

This document captures the explicit assumptions made during the design and implementation of Log Sentinel.

---

## Log Format

1. The log file written at `/logs/app.log` uses a machine-readable **key=value space-delimited** format with an ISO-8601 UTC timestamp prefix.
   ```
   2024-01-01T00:00:00.000Z event=FAILED_LOGIN ip=1.2.3.4 user=admin path=/auth/login status=401 method=POST
   ```
2. Log lines produced outside of the built-in `logWriter.service` (e.g., injected directly by the simulation script) must respect this same format to be parseable.
3. The `user` field is optional — some events (e.g., scanner probes without auth context) will not have it.

---

## Network & Deployment

4. The service listens on `0.0.0.0` to support Docker-mounted networking correctly.
5. When running behind a proxy (Nginx, AWS ALB), `x-forwarded-for` is respected as the client IP. In direct mode, `req.ip` is used.
6. The Docker `test command` mounts the host `./logs` volume at `/logs` inside the container. The service reads and writes to `/logs/app.log` via this mount.

---

## Detection Engine

7. All detection logic is purely **log-based** — no network packet inspection, no kernel hooks. Alerts are derived exclusively from structured log events.
8. Detection rules use **sliding time windows** with **in-memory state**. On server restart, state is reset; alerts from previous runs are not re-evaluated.
9. Deduplication is intentional — the same alert type from the same IP will not fire again during its cooldown period to prevent alert fatigue.
10. Signature-based rules (`PATH_TRAVERSAL`, `SQL_INJECTION`) fire on a **single event** match. Behavioral rules accumulate over time windows.

---

## Severity Levels

11. `LOW` — informational, potential noise (high request rate)
12. `MEDIUM` — suspicious pattern, warrants review (brute force, credential stuffing, forbidden probing)
13. `HIGH` — strong indicator of active compromise (path traversal, SQLi, possible compromise, persistent brute force)

---

## Scope Boundaries

14. **Out of scope**: User authentication for the alert API itself, persistent DB (MongoDB is optional), distributed multi-node state synchronization.
15. **Out of scope**: Real-time agent deployment, eBPF, syslog integration, SIEM forwarding. These are `todo.md` items.
16. Email sending is **simulated** (async no-op) in the current build. A real provider (Resend, SendGrid) would be wired in production.
