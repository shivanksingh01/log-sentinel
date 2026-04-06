# Step 6: Optional Advanced Layer - Persistence + Notifications

## Overview
This document outlines the final enhancement layer for the LogSentinel backend, focusing on making the system more production-like by adding persistence and external notifications.

**Important:** These features are optional enhancements added without introducing mandatory external dependencies, ensuring the core pipeline remains simple and reliable.

## Features Implemented

1. **File-Based Persistence (`src/persistence/fileStore.service.js`)**
   - Saves all generated alerts to a JSON file (`/data/alerts.json`).
   - Uses NDJSON (Newline Delimited JSON) format for efficient append operations.
   - Automatically creates the `data` directory and `alerts.json` file if they do not exist.
   - Operates asynchronously to avoid blocking the main alert creation workflow.

2. **Webhook Notification (`src/notifications/webhookNotifier.js`)**
   - Automatically POSTs new alerts to a configured external webhook.
   - Utilizes `fetch` for lightweight, dependency-free HTTP requests.
   - Configurable via the `WEBHOOK_URL` environment variable (defaults to a mock local endpoint).

3. **Email Notification (`src/notifications/emailNotifier.js`)**
   - Sends simulated email notifications exclusively for `HIGH` severity alerts.
   - Formats critical alert data (type, severity, IP, user, message) into a readable email body.
   - Asynchronous and resilient, mimicking third-party provider behavior like Resend or SendGrid.

4. **Notification Orchestration (`src/notifications/notification.service.js`)**
   - Coordinates the dispatch of webhooks and emails.
   - Ensures that all tasks run concurrently using `Promise.all`.
   - Safely catches and logs any transport errors without breaking the main threat detection loop.

## Changes Made
- Added `src/notifications/` directory with `notification.service.js`, `webhookNotifier.js`, and `emailNotifier.js`.
- Added `src/persistence/` directory with `fileStore.service.js`.
- Updated `src/services/alert.service.js` to dispatch alerts to the `fileStoreService` and `notificationService`.

## Failure Handling Strategy
A critical rule enforced in this implementation is **Notification failures must NEVER break detection flow**.
If a webhook or email fails to send, or if writing to the persistence file encounters an IO error, the system logs the failure and gracefully continues executing. 

## How To Verify
- **Persistence Verification:** Generate a mock alert. Check that `/data/alerts.json` contains the new NDJSON entry.
- **Webhook Verification:** Start a mock HTTP listener or inspect application logs `[NOTIFY] Webhook sent for alert <id>`.
- **Email Verification:** Generate a `HIGH` severity alert. Verify the log states `[EMAIL] Sent HIGH severity alert for <id>`.
