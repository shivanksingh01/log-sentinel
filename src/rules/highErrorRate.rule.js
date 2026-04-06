const config = require('../config/detection');

/**
 * High Error Rate Detection Rule
 * Detects IPs generating an unusually high percentage of 4xx/5xx HTTP errors.
 * Indicates broken automated clients, scanners, or fuzzing tools.
 * At least a minimum number of requests must be seen before triggering.
 */
const ERROR_STATUS_MIN = 400;

const evaluate = (event, stateService) => {
    if (!event.ip) return null;

    const { errorRateThreshold, minRequests, windowSec, cooldownSec } = config.highErrorRate;
    const recentRequests = stateService.getRecentRequestsByIp(event.ip, windowSec);

    if (recentRequests.length < minRequests) return null;

    const errorCount = recentRequests.filter(e => e.status >= ERROR_STATUS_MIN).length;
    const errorRate = errorCount / recentRequests.length;

    if (errorRate >= errorRateThreshold) {
        return {
            type: 'HIGH_ERROR_RATE',
            severity: 'MEDIUM',
            ip: event.ip,
            message: `Unusually high HTTP error rate detected from this IP`,
            evidence: {
                totalRequests: recentRequests.length,
                errorRequests: errorCount,
                errorRatePercent: Math.round(errorRate * 100),
                windowSeconds: windowSec
            },
            dedupeKey: `HIGH_ERROR_RATE:${event.ip}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
