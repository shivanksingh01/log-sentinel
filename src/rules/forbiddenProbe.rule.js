const config = require('../config/detection');

/**
 * Forbidden Access Probing Rule
 * Detects IPs repeatedly hitting 403 Forbidden endpoints.
 * Indicates unauthorized area reconnaissance, privilege escalation attempts,
 * or systematic access control bypass testing.
 */
const evaluate = (event, stateService) => {
    if (!event.ip || event.status !== 403) return null;

    const { threshold, windowSec, cooldownSec } = config.forbiddenProbe;

    const recentRequests = stateService.getRecentRequestsByIp(event.ip, windowSec);
    const forbidden403s = recentRequests.filter(e => e.status === 403);

    if (forbidden403s.length >= threshold) {
        return {
            type: 'FORBIDDEN_ACCESS_PROBE',
            severity: 'MEDIUM',
            ip: event.ip,
            user: event.user,
            message: `Repeated access to forbidden endpoints detected`,
            evidence: {
                forbiddenAttempts: forbidden403s.length,
                windowSeconds: windowSec
            },
            dedupeKey: `FORBIDDEN_ACCESS_PROBE:${event.ip}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
