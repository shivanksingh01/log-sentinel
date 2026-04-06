const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const env = require('../config/env');
const { getOffset, setOffset } = require('../utils/fileOffsetStore');
const { processRawLogLine } = require('./logProcessor.service');

const LOG_DIR = env.LOG_DIR;

let watcher = null;

// Debounce map to prevent rapid-fire duplicate reads
const debounceTimers = {};
const DEBOUNCE_MS = 100;

/**
 * Check if a filename is a valid application log file that should be parsed
 */
const isValidAppLog = (filename) => {
    return filename && filename.startsWith('app') && filename.endsWith('.log');
};

/**
 * Read new content from a log file starting at the tracked offset.
 * Splits new content into lines and sends each to the processor.
 *
 * @param {string} filename - The log filename (e.g. "app-2023-10-26-10.log")
 */
const readNewLines = (filename) => {
    const filePath = path.join(LOG_DIR, filename);

    if (!fs.existsSync(filePath)) return;

    const stat = fs.statSync(filePath);
    const currentSize = stat.size;
    const lastOffset = getOffset(filename);

    if (currentSize <= lastOffset) return; // No new data

    const bytesToRead = currentSize - lastOffset;
    const buffer = Buffer.alloc(bytesToRead);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, bytesToRead, lastOffset);
    fs.closeSync(fd);

    setOffset(filename, currentSize);

    const content = buffer.toString('utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
        if (line.trim().length > 0) {
            logger.info(`[WATCHER] New log line detected: ${line.trim()}`);
            processRawLogLine(line);
        }
    }
};

/**
 * Start the file watcher on the LOG_DIR directory.
 *
 * Startup behavior:
 * - LOG_SCAN_FROM_START=true (or running in Docker with /logs mounted):
 *     Offset starts at 0 → entire existing file content is scanned immediately.
 *     This is the key behavior for `docker run -v $(pwd)/logs:/logs`.
 * - LOG_SCAN_FROM_START=false (default local dev):
 *     Offset starts at current EOF → only new lines added after startup are processed.
 */
const startWatcher = () => {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const existingFiles = fs.readdirSync(LOG_DIR).filter(isValidAppLog);

    if (env.LOG_SCAN_FROM_START) {
        // --- MOUNTED VOLUME MODE ---
        // Scan all existing log file content from byte 0
        logger.info(`[WATCHER] LOG_SCAN_FROM_START=true — scanning existing log content in: ${LOG_DIR}`);
        for (const file of existingFiles) {
            setOffset(file, 0); // Start from beginning
        }
        // Process all existing lines immediately before watching for new ones
        for (const file of existingFiles) {
            logger.info(`[WATCHER] Processing existing content of: ${file}`);
            readNewLines(file);
        }
    } else {
        // --- LOCAL DEV MODE ---
        // Skip existing content, only tail new lines
        for (const file of existingFiles) {
            const filePath = path.join(LOG_DIR, file);
            const stat = fs.statSync(filePath);
            setOffset(file, stat.size);
            logger.debug(`[WATCHER] Initialized offset for ${file}: ${stat.size} bytes (tail mode)`);
        }
    }

    // Watch for new writes to the directory
    watcher = fs.watch(LOG_DIR, (eventType, filename) => {
        if (!isValidAppLog(filename)) return;
        if (eventType !== 'change') return;

        if (debounceTimers[filename]) {
            clearTimeout(debounceTimers[filename]);
        }

        debounceTimers[filename] = setTimeout(() => {
            readNewLines(filename);
            delete debounceTimers[filename];
        }, DEBOUNCE_MS);
    });

    logger.info(`[WATCHER] Monitoring log directory: ${LOG_DIR}`);
};

/**
 * Stop the file watcher (for graceful shutdown)
 */
const stopWatcher = () => {
    if (watcher) {
        watcher.close();
        watcher = null;
        logger.info('[WATCHER] File watcher stopped');
    }
    for (const key of Object.keys(debounceTimers)) {
        clearTimeout(debounceTimers[key]);
        delete debounceTimers[key];
    }
};

module.exports = { startWatcher, stopWatcher };
