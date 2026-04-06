# TODO

Future improvements that were not implemented within the time-box of this assignment.

---

## High Priority

- [ ] **Persistent offset tracking** — Serialize `watcher.service.js` byte-offset pointers to disk/Redis so that the Node application can survive crashes and container restarts without parsing the same log blocks over again or missing new bytes.
- [ ] **Persistent alert store with MongoDB** — Wire the optional MongoDB path in `fileStore.service.js` so alerts survive restarts and are queryable. Add pagination to `GET /api/v1/alerts`.
- [ ] **Rate-limit the SSE endpoint** — Prevent a single client from opening dozens of SSE connections and starving the server.

---

## Detection Engine

- [ ] **Expanded Generic Payload Context** — When parsing unknown generic log structures, extract elements beyond IPs (like user-agents or exact timestamp matches) via LLM or robust Grok parsers to enrich fallback alerts.
- [ ] **Geolocation anomaly detection** — Flag logins from unusual countries using a MaxMind GeoIP database lookup.
- [ ] **User-Agent fingerprinting rule** — Match requests from known scanner UAs (Nikto, sqlmap, Hydra, Masscan) and immediately escalate to HIGH.
- [ ] **Slow HTTP attack detection** — Detect Slowloris-style connections that keep the server busy without completing requests.
- [ ] **Account enumeration detection** — Distinct from credential stuffing, detect when an IP probes whether usernames exist (e.g., timing-based enumeration via 401 vs 403 responses).
- [ ] **Recursive directory scan detection** — Deep path probing where an attacker traverses a tree of paths sequentially.

---

## Observability

- [ ] **Structured alert schema versioning** — Add a `schemaVersion` field to persisted alerts to handle future migrations.
- [ ] **Prometheus `/metrics` endpoint** — Export alert counts, suppression rates, and detection latency as Prometheus counters for Grafana dashboards.
- [ ] **Distributed tracing** — Add `x-request-id` correlation across the ingestion → detection → alert pipeline.

---

## Infrastructure

- [ ] **Docker Compose file** — Ship a `docker-compose.yml` with the app + a mock webhook receiver for instant local simulation.
- [ ] **SIEM integration** — Forward alerts to Elastic SIEM via Logstash or the ECS log format.
- [ ] **Horizontal scaleout** — Replace in-memory state with Redis for multi-node deployments.
- [ ] **Kubernetes readiness/liveness probes** — The health endpoint is already in place; add proper k8s manifests.
