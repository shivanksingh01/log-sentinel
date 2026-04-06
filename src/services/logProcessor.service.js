const logger = require('../config/logger');

/**
 * Process a raw log line detected by the watcher.
 * 
 * This is a placeholder — Step 3 will replace the internals
 * with actual parsing + normalization into event objects.
 * 
 * @param {string} line - A single raw log line from app.log
 */
const processRawLogLine = (line) => {
    if (!line || line.trim().length === 0) {
        return; // skip blank lines
    }

    logger.info(`[PROCESSOR] Raw log line received: ${line.trim()}`);
};

module.exports = {
    processRawLogLine,
};
