const config = require('../config/detection');

/**
 * Brute Force Detection Rule
 * Escalates severity based on attempt count:
 *   >= threshold => MEDIUM
 *   >= threshold * 2 => HIGH
 */
const evaluate = (event, stateService) => {
    if (event.eventType !== 'FAILED_LOGIN' || !event.ip) return null;

    const { threshold, windowSec, cooldownSec } = config.bruteForce;
    const recentFailures = stateService.getRecentFailedLoginsByIp(event.ip, windowSec);

    if (recentFailures.length >= threshold) {
        const severity = recentFailures.length >= threshold * 2 ? 'HIGH' : 'MEDIUM';
        return {
            type: 'BRUTE_FORCE_LOGIN',
            severity,
            ip: event.ip,
            user: event.user,
            message: `Multiple failed login attempts detected from same IP (${recentFailures.length} attempts)`,
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
