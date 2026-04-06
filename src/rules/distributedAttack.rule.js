const config = require('../config/detection');

/**
 * Distributed Attack Detection Rule
 * Checks if one username receives failed login attempts from many different IPs.
 */
const evaluate = (event, stateService) => {
    if (event.eventType !== 'FAILED_LOGIN' || !event.user) return null;

    const { threshold, windowSec, cooldownSec } = config.distributedAttack;
    
    // Get recent failed logins for this user
    const recentFailures = stateService.getRecentFailedLoginsByUser(event.user, windowSec);
    
    // Count distinct IPs
    const distinctIps = new Set(
        recentFailures
            .filter(e => e.ip)
            .map(e => e.ip)
    );

    if (distinctIps.size >= threshold) {
        return {
            type: 'DISTRIBUTED_ACCOUNT_ATTACK',
            severity: 'MEDIUM',
            user: event.user,
            message: 'Multiple distinct IPs attempting to login to the same account',
            evidence: {
                distinctIps: distinctIps.size,
                windowSeconds: windowSec
            },
            dedupeKey: `DISTRIBUTED_ACCOUNT_ATTACK:${event.user}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
