# LogSentinel — Step 3 Implementation
## Log Parser + Normalized Event Model

### Milestone Achieved
This document outlines the completion of **Step 3**, which introduces the **log parsing layer** of the intrusion detection system. 

The backend can now:
- Read raw structured log lines detected by the file watcher
- Parse them into a predictable internal object (LogEvent)
- Validate required fields successfully
- Reject malformed lines safely without crashing
- Track parsing metrics (processed vs failures) allowing observability

---

### Files Created & Updated

#### **Models (`src/models/Event.js`)**
- Created a standard internal representation for all log events. 
- Normalizes logs securely to be later passed to the detection engine, requiring properties such as `timestamp`, `eventType`, `ip`, `path`, `status`, and `method`.

#### **Parsers (`src/services/parser.service.js`)**
- Added the core parsing engine that leverages token-split strategies mapping standard KV string tags to internal object shapes.
- Automatically handles integer casting (e.g. `status` to integer).
- Safely validates strings and tracks incomplete schemas natively by returning `null`.

#### **Metrics (`src/services/stats.service.js` & `src/routes/stats.routes.js`)**
- Built an internal state tracking standard variables (`logsProcessed`, `filesWatched`, `parseErrors`, etc.).
- Registered corresponding GET `/api/v1/stats` endpoint inside `src/app.js` to observe metrics in real-time.

#### **Processor Update (`src/services/logProcessor.service.js`)**
- Substituted the static placeholder strings from Step 2 with actual hooks tying the `parser.service.js` output straight back into the central pipeline.

---

### End-To-End Walkthrough

When incoming triggers occur (e.g., calling `/api/v1/products` or failing auth with `/auth/login`):

1. **Ingestion & Append**: `logWriter` writes structured string formats straight into `app.log`.
2. **Detection Hook**: `watcher.service` observes the byte-offset, identifying unparsed appends.
3. **Trigger**: Pushes event line to `logProcessor.service.js`.
4. **Parse Phase**: Hits `parserService.parseLogLine(line)`. Parses and constructs cleanly formatted instances or flags failures tracking the `parseErrors` increment stats.
5. **Observability Feedback**: Pushes debug string logs tracking system viability in terminal: `[PARSER] Parsed event: ...` or `[PARSER][WARN] Failed to parse line...` 

---

### Next Steps (Step 4 Preview)
As part of Step 4, we will introduce the **Detection Engine + Rule Evaluation**, hooking directly into our established standard data objects defined here (LogEvents). Areas to cover include credential stuffing, request abuse, and brute-force tracking using rolling state states mapping specific normalized Event fields.
