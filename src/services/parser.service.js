const LogEvent = require('../models/Event');
const logger = require('../config/logger');

/**
 * Parses a raw log line into a normalized LogEvent.
 *
 * Expected format (key=value space-delimited):
 *   <ISO8601_timestamp> event=<TYPE> ip=<IP> [user=<USER>] path=<PATH> status=<STATUS> method=<METHOD>
 *
 * Design decisions:
 * - Lenient parsing: missing optional fields (user) are allowed.
 * - path field values may contain URL-encoded characters.
 * - Lines that are entirely unparseable return null and increment parse error stats.
 */
const parseLogLine = (line) => {
    try {
        if (!line || typeof line !== 'string') return null;
        const trimmed = line.trim();
        if (trimmed.length === 0) return null;

        const spaceIdx = trimmed.indexOf(' ');
        if (spaceIdx === -1) return null;

        const timestamp = trimmed.substring(0, spaceIdx);
        const rest = trimmed.substring(spaceIdx + 1);

        // Parse key=value pairs — values may include url-encoded chars but not spaces
        const data = {};
        const KEY_VAL_RE = /(\w+)=([^\s]+)/g;
        let match;
        while ((match = KEY_VAL_RE.exec(rest)) !== null) {
            data[match[1]] = match[2];
        }

        // Validate minimum required fields
        if (!timestamp || !data.event || !data.ip) {
            return null;
        }

        const statusNumber = data.status ? parseInt(data.status, 10) : 0;

        const event = new LogEvent({
            timestamp,
            eventType: data.event,
            ip: data.ip,
            user: data.user || null,
            path: data.path || '/',
            status: isNaN(statusNumber) ? 0 : statusNumber,
            method: data.method || 'GET',
            raw: trimmed
        });

        return event;

    } catch (error) {
        logger.warn(`[PARSER][ERROR] Exception parsing line: ${error.message}`);
        return null;
    }
};

module.exports = { parseLogLine };
