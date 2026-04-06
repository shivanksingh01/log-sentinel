const LogEvent = require('../models/Event');
const logger = require('../config/logger');

/**
 * Parses a raw log line into a LogEvent object.
 * 
 * @param {string} line - Raw log line
 * @returns {LogEvent|null} - Parsed event or null if malformed
 */
const parseLogLine = (line) => {
    try {
        if (!line || typeof line !== 'string') return null;

        const parts = line.trim().split(' ');
        if (parts.length < 2) return null;

        const timestamp = parts[0];
        
        const kvPairs = parts.slice(1);
        const data = {};

        kvPairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                data[key] = value;
            }
        });

        // Validate required fields
        if (!timestamp || !data.event || !data.ip || !data.path || !data.status || !data.method) {
            return null; // Missing required fields
        }

        const statusNumber = parseInt(data.status, 10);
        if (isNaN(statusNumber)) {
            return null;
        }

        const event = new LogEvent({
            timestamp: timestamp,
            eventType: data.event,
            ip: data.ip,
            user: data.user,
            path: data.path,
            status: statusNumber,
            method: data.method,
            raw: line.trim()
        });

        return event;

    } catch (error) {
        logger.warn(`[PARSER][ERROR] Failed to parse line due to exception: ${error.message}`);
        return null;
    }
};

module.exports = { parseLogLine };
