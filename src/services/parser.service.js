const LogEvent = require('../models/Event');
const logger = require('../config/logger');

/**
 * Parses a raw log line into a normalized LogEvent.
 *
 * Expected structured format:
 *   <ISO8601_timestamp> event=<TYPE> ip=<IP> [user=<USER>] path=<PATH> status=<STATUS> method=<METHOD>
 *
 * Fallback unstructured format (any log type):
 *   Checks for any IP address and assigns the raw log string to `path` so payload signature scanners can work.
 */
const parseLogLine = (line) => {
    try {
        if (!line || typeof line !== 'string') return null;
        const trimmed = line.trim();
        if (trimmed.length === 0) return null;

        // Try to parse structured first
        const spaceIdx = trimmed.indexOf(' ');
        let timestamp = new Date().toISOString();
        let rest = trimmed;

        if (spaceIdx !== -1) {
            const possibleTimestamp = trimmed.substring(0, spaceIdx);
            // Rough check for ISO-like timestamp
            if (possibleTimestamp.includes('T') && possibleTimestamp.includes('Z')) {
                timestamp = possibleTimestamp;
                rest = trimmed.substring(spaceIdx + 1);
            }
        }

        const data = {};
        const KEY_VAL_RE = /(\w+)=([^\s]+)/g;
        let match;
        let foundStructuredParams = false;
        while ((match = KEY_VAL_RE.exec(rest)) !== null) {
            data[match[1]] = match[2];
            foundStructuredParams = true;
        }

        let eventType = data.event;
        let ip = data.ip;
        let pathStr = data.path || '/';
        let statusNumber = data.status ? parseInt(data.status, 10) : 0;
        let method = data.method || 'GET';
        let user = data.user || null;

        // If structured fields are missing, treat as an unstructured generic log
        if (!eventType || !ip) {
            // Unstructured fallback: Look for an IP address anywhere in the raw log
            const ipMatch = trimmed.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            ip = ipMatch ? ipMatch[0] : '0.0.0.0';
            eventType = 'RAW_LOG';
            pathStr = trimmed; // Put the raw line in path so SQLi/PathTraversal rules scan it!
            statusNumber = 0;
            method = 'UNKNOWN';
        }

        const event = new LogEvent({
            timestamp,
            eventType: eventType,
            ip: ip,
            user: user,
            path: pathStr,
            status: isNaN(statusNumber) ? 0 : statusNumber,
            method: method,
            raw: trimmed
        });

        return event;

    } catch (error) {
        logger.warn(`[PARSER][ERROR] Exception parsing line: ${error.message}`);
        return null;
    }
};

module.exports = { parseLogLine };
