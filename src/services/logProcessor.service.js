const logger = require('../config/logger');
const parserService = require('./parser.service');
const statsService = require('./stats.service');
const util = require('util');

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
        logger.info(`[PARSER] Parsed event: \n${util.inspect(parsedEvent, { depth: null, colors: false })}`);
    } else {
        statsService.incrementParseErrors();
        logger.warn(`[PARSER][WARN] Failed to parse line: ${line.trim()}`);
    }
};

module.exports = {
    processRawLogLine,
};
