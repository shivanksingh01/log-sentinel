const logger = require('../config/logger');
const parserService = require('./parser.service');
const statsService = require('./stats.service');
const util = require('util');

const detectionService = require('./detection.service');

/**
 * Process a raw log line detected by the watcher.
 * 
 * @param {string} line - A single raw log line from app.log
 */
const processRawLogLine = (line) => {
    if (!line || line.trim().length === 0) {
        return; // skip blank lines
    }

    const parsedEvent = parserService.parseLogLine(line);

    if (parsedEvent) {
        statsService.incrementLogsProcessed();
        // Skip spammy logging now that we have rules actually emitting alerts
        // logger.info(`[PARSER] Parsed event: \n${util.inspect(parsedEvent, { depth: null, colors: false })}`);
        
        // Let the detection engine process it
        detectionService.processEvent(parsedEvent);
    } else {
        statsService.incrementParseErrors();
        logger.warn(`[PARSER][WARN] Failed to parse line: ${line.trim()}`);
    }
};

module.exports = {
    processRawLogLine,
};
