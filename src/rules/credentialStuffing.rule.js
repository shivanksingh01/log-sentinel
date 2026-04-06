const config = require('../config/detection');

/**
 * Credential Stuffing Detection Rule
 * Checks if the same IP tries many different usernames in a short time.
 */
const evaluate = (event, stateService) => {
    if (event.eventType !== 'FAILED_LOGIN' || !event.ip) return null;

    const { threshold, windowSec, cooldownSec } = config.credentialStuffing;
    
    // Get recent failed logins for this IP to analyze usernames
    const recentFailures = stateService.getRecentFailedLoginsByIp(event.ip, windowSec);
    
    // Count distinct users tried by this IP
    const distinctUsers = new Set(
        recentFailures
            .filter(e => e.user)
            .map(e => e.user)
    );

    if (distinctUsers.size >= threshold) {
        return {
            type: 'CREDENTIAL_STUFFING',
            severity: 'MEDIUM',
            ip: event.ip,
            message: 'Same IP attempting to login with many different usernames',
            evidence: {
                distinctUsersTried: distinctUsers.size,
                windowSeconds: windowSec
            },
            dedupeKey: `CREDENTIAL_STUFFING:${event.ip}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
