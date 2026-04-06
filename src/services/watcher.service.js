const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { getOffset, setOffset } = require('../utils/fileOffsetStore');
const { processRawLogLine } = require('./logProcessor.service');
const { LOG_DIR } = require('./logWriter.service');

let watcher = null;

// Debounce map to prevent rapid-fire duplicate reads
const debounceTimers = {};
const DEBOUNCE_MS = 100;

/**
 * Read new content from a log file starting at the tracked offset.
 * Splits new content into lines and sends each to the processor.
 * 
 * @param {string} filename - The log filename (e.g. "app.log")
 */
const readNewLines = (filename) => {
    const filePath = path.join(LOG_DIR, filename);

    // Ensure the file still exists
    if (!fs.existsSync(filePath)) {
        return;
    }

    const stat = fs.statSync(filePath);
    const currentSize = stat.size;
    const lastOffset = getOffset(filename);

    // No new data
    if (currentSize <= lastOffset) {
        return;
    }

    // Read only the new bytes
    const bytesToRead = currentSize - lastOffset;
    const buffer = Buffer.alloc(bytesToRead);
    const fd = fs.openSync(filePath, 'r');

    fs.readSync(fd, buffer, 0, bytesToRead, lastOffset);
    fs.closeSync(fd);

    // Update offset
    setOffset(filename, currentSize);

    // Split into individual lines and process each
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
 * Start the file watcher on the /logs directory.
 * Watches for file changes and reads new content using offsets.
 */
const startWatcher = () => {
    // Ensure the log directory exists
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Initialize offsets for existing files (start from end to skip old data)
    const existingFiles = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log'));
    for (const file of existingFiles) {
        const filePath = path.join(LOG_DIR, file);
        const stat = fs.statSync(filePath);
        setOffset(file, stat.size);
        logger.debug(`[WATCHER] Initialized offset for ${file}: ${stat.size} bytes`);
    }

    watcher = fs.watch(LOG_DIR, (eventType, filename) => {
        // Only care about log files that changed
        if (!filename || !filename.endsWith('.log')) {
            return;
        }

        if (eventType !== 'change') {
            return;
        }

        // Debounce rapid events for the same file
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

    // Clear any pending debounce timers
    for (const key of Object.keys(debounceTimers)) {
        clearTimeout(debounceTimers[key]);
        delete debounceTimers[key];
    }
};

module.exports = {
    startWatcher,
    stopWatcher,
};
