/**
 * LogEvent Model
 * Represents a parsed and normalized log event.
 */
class LogEvent {
    /**
     * @param {Object} data 
     * @param {string} data.timestamp
     * @param {string} data.eventType
     * @param {string} data.ip
     * @param {string} [data.user]
     * @param {string} data.path
     * @param {number} data.status
     * @param {string} data.method
     * @param {string} data.raw
     */
    constructor({ timestamp, eventType, ip, user, path, status, method, raw }) {
        this.timestamp = timestamp;
        this.eventType = eventType;
        this.ip = ip;
        if (user) {
            this.user = user;
        }
        this.path = path;
        this.status = status;
        this.method = method;
        this.raw = raw;
    }
}

module.exports = LogEvent;
