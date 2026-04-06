const config = require('../config/detection');

/**
 * Fail-Then-Success Detection Rule
 * Checks if multiple failed logins are followed by a successful login for the same IP/user.
 */
const evaluate = (event, stateService) => {
    if (event.eventType !== 'LOGIN_SUCCESS' || !event.ip || !event.user) return null;

    const { failedThreshold, windowSec, cooldownSec } = config.possibleCompromise;
    
    // Check if there were multiple failures right before this success
    const recentFailures = stateService.getRecentFailuresByIpUser(event.ip, event.user, windowSec);

    if (recentFailures.length >= failedThreshold) {
        return {
            type: 'POSSIBLE_COMPROMISE',
            severity: 'HIGH',
            ip: event.ip,
            user: event.user,
            message: 'Multiple failed logins followed by successful login',
            evidence: {
                failedAttemptsBeforeSuccess: recentFailures.length,
                windowSeconds: windowSec
            },
            dedupeKey: `POSSIBLE_COMPROMISE:${event.ip}:${event.user}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
