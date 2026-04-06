const config = require('../config/detection');

/**
 * Request Abuse Detection Rule
 * Checks if one IP makes too many requests in a short time.
 */
const evaluate = (event, stateService) => {
    if (event.eventType !== 'REQUEST' || !event.ip) return null;

    const { threshold, windowSec, cooldownSec } = config.requestAbuse;
    
    // Get recent requests for this IP
    const recentRequests = stateService.getRecentRequestsByIp(event.ip, windowSec);

    if (recentRequests.length >= threshold) {
        return {
            type: 'REQUEST_ABUSE',
            severity: 'LOW', // or MEDIUM based on config, document says LOW or MEDIUM
            ip: event.ip,
            message: 'High request rate detected from a single IP',
            evidence: {
                requestCount: recentRequests.length,
                windowSeconds: windowSec
            },
            dedupeKey: `REQUEST_ABUSE:${event.ip}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
