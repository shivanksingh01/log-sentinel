const config = require('../config/detection');

/**
 * Brute Force Detection Rule
 * Checks if the same IP generates too many failed login attempts in a short time window.
 */
const evaluate = (event, stateService) => {
    if (event.eventType !== 'FAILED_LOGIN' || !event.ip) return null;

    const { threshold, windowSec, cooldownSec } = config.bruteForce;
    
    // Get recent failed logins for this IP
    const recentFailures = stateService.getRecentFailedLoginsByIp(event.ip, windowSec);

    if (recentFailures.length >= threshold) {
        return {
            type: 'BRUTE_FORCE_LOGIN',
            severity: 'MEDIUM',
            ip: event.ip,
            user: event.user,
            message: 'Multiple failed login attempts detected from same IP',
            evidence: {
                failedAttempts: recentFailures.length,
                windowSeconds: windowSec
            },
            dedupeKey: `BRUTE_FORCE_LOGIN:${event.ip}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
