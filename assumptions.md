# Assumptions

This document captures the explicit assumptions made during the design and implementation of Log Sentinel.

---

## Log Format & Ingestion

1. The primary log format is a machine-readable **key=value space-delimited** string with an ISO-8601 UTC timestamp prefix.
2. **Fallback Parsing**: It is assumed that third-party unstructured logs (NGINX, standard Syslog, error stacks) might be dropped into the `/logs` directory. If they lack the key=value structure, the parser assumes any extracted contiguous string matching an IPv4 address is the `ip`, and assigns the string payload to the `path` to enable signature-based detection (SQLi/Path Traversal).
3. The file watcher recursively tails any file in the `/logs` directory, making the strict assumption that files matching `*info-*`, `*error-*`, and `*critical-*` are internally generated and should be ignored to prevent circular processing loops.

---

## Network & Deployment

4. The service listens on `0.0.0.0` to support Docker-mounted networking correctly.
5. When running behind a proxy (Nginx, AWS ALB), `x-forwarded-for` is respected as the client IP. In direct mode, `req.ip` is used.
6. The Docker `test command` mounts the host directory to `/logs` inside the container. The service discovers and reads all newly written bytes across all valid log files in this mount.

---

## Detection Engine & Resilience

7. All detection logic is purely **log-based** — no network packet inspection, no kernel hooks. Alerts are derived exclusively from structured log events.
8. Detection rules use **sliding time windows** with **in-memory state**. On server restart, state is reset; alerts from previous runs are not re-evaluated.
9. **Correctness Under Retries**: File offsets (tracking which bytes have been read) are held in memory. On container restart, the watcher defaults to "tailing" existing files (skipping old lines) unless configured otherwise. Older data isn't re-processed to prevent duplicated alert spam upon restarts.
10. Deduplication is intentional — the same alert type from the same IP will not fire again during its cooldown period to prevent alert fatigue.
11. Signature-based rules (`PATH_TRAVERSAL`, `SQL_INJECTION`) fire on a **single event** match by coercing HTTP methods to `UNKNOWN` if not explicitly structured in the string.

---

## Severity Levels

12. `LOW` — informational, potential noise (high request rate)
13. `MEDIUM` — suspicious pattern, warrants review (brute force, credential stuffing, forbidden probing)
14. `HIGH` — strong indicator of active compromise (path traversal, SQLi, possible compromise, persistent brute force)

---

## Scope Boundaries

15. **Out of scope**: User authentication for the alert API itself, distributed multi-node state synchronization.
16. **Out of scope**: Real-time agent deployment, eBPF, syslog integration, SIEM forwarding. These are `todo.md` items.
17. Application failures (e.g., malformed log line, missing properties) are localized and caught cleanly; they will never crash the central parser/ingestion loop.
18. **Push Notifications**: Email notifications are handled natively via the Resend API. It is assumed the `RESEND_API_KEY` and `EMAIL_FROM` are pre-provisioned for the assignment's operational scope, requiring only the `EMAIL_TO` to be configured by the user.
