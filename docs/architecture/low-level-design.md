# Low-Level Design (LLD) - Log Sentinel

## 1. Overview
This document supplements the High-Level Design by providing the technical blueprint and interaction models of internal class structures, functions, and state interactions within the Log Sentinel application.

## 2. Component Specifications

### 2.1 Watcher Service (`src/services/watcher.service.js`)
- **Initialization**: Opens file descriptor via `fs.promises.open()`.
- **Offset Tracking**: Stores the `currentOffset` internally representing the byte size of what's been read. On initialization, evaluates if the log file already exists and determines starting offset based on configuration (either `0` or chunk size bytes to EOF).
- **Polling Loop**: Executes bounded `setInterval` utilizing `fs.stat` determining file size changes natively.
- **Buffer Reading**: If `newSize > currentOffset`, extracts exact byte differential using `fs.readEmptyBuffer()`, decodes via `utf-8` then sequentially processes string array blocks delimited by newline constructs.

### 2.2 Parser Service (`src/services/parser.service.js`)
- **Regular Expressions**: Relies heavily on optimized RegEx named capture groups strictly bound by `^` and `$`.
- **Extraction Model**:
  ```javascript
  const LOG_REGEX = /^\[(?<timestamp>.*?)\] \[(?<level>.*?)\] \[(?<event>.*?)\] (?<message>.*)$/;
  const KEY_VAL_REGEX = /(?<key>[a-zA-Z0-9_]+)=(?<value>[^\s]+)/g;
  ```
- **Execution**: Takes output string from Processor. If string matches structure, returns `Event` Object containing `timestamp`, `level`, `type`, `message`, and key-value payload object. Drops unrecognized structures returning `null`.

### 2.3 Detection Engine (`src/services/detection.service.js`)
- **Rules Mapping**: Internally array structured functions representing independent Detection Rules evaluated synchronously.
- **Rule Specification (Brute Force Example)**:
    - Filters: Takes Event payload `type === 'FAILED_LOGIN'`.
    - Mutates: Increments failure counter associated with payload `ip` within State Service.
    - Yields: Verifies if current increment > `5`. If standard triggers, returns `Alert` creation request map with dedupication signature.
- **Delegation**: If a rule returns a valid map payload, redirects trigger to `alert.service.js`.

### 2.4 State Management (`src/services/state.service.js`)
- **Memory Maps**: Dedicated native Javascript `Map()` structures housing string keyed integers (E.g. `failedLoginsMap` IP -> count).
- **Time Windowing Tracking**: Retains latest touch interaction epochs mapped independently per key.
- **Garbage Collection (GC)**: Contains a self-triggering `setInterval` function executing at distinct configurations evaluating timestamp delta against expiry configurations. Trims stale objects freeing heap footprint.

### 2.5 Alert Service (`src/services/alert.service.js`)
- **Suppression/Deduplication Matrix**: Enforces cooldowns limiting repetitive logging utilizing isolated Map `lastAlertTimestampMap` structured around rule specific unique keys. Returns boolean suppression logic block terminating pipeline.
- **Fan Out Generation**: 
  - Submits valid alert instance payloads sequentially to standard Output `logger`.
  - Fires Node `EventEmitter` native pipeline routing the object instance directly to `sse.service.js`.

### 2.6 Persistence & Integration (`src/persistence/fileStore.service.js` & `src/notifications/notification.service.js`)
- **Non Blocking Isolation**: Invoked inline by Alert Service leveraging unresolved promises `<Promise>.catch()` permitting parent event loop continuations explicitly ignoring upstream application failure limits.
- **NDJSON Implementation**: Directly streams single unified string objects via `fs.promises.appendFile()` structured sequentially divided via newlines guaranteeing fast linear complexity operations.
- **Fetch Fallback**: Triggers basic `fetch` library against dynamically determined Environment endpoints mitigating integration application complexities.

## 3. Storage Hierarchy
`data/alerts.json` serves exclusively as the write mechanism handling outputs utilizing line separated payloads ensuring strict format adherence and preventing memory overloads associated with standard array modifications on large objects. Minimum payload shape ensures parsing reliability: `{"id": "...", "severity": "...", "timestamp": "...", "type": "..."}`.
