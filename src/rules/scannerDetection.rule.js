const config = require('../config/detection');

/**
 * Scanner / Automated Bot Detection Rule
 * Detects IPs that probe multiple different paths rapidly — characteristic of
 * vulnerability scanners like Nikto, Nessus, Shodan, dirbuster, gobuster, etc.
 * 
 * Heuristic: If an IP hits N+ DISTINCT paths in a short window, it's scanning.
 */
const evaluate = (event, stateService) => {
    if (!event.ip || !event.path) return null;

    const { threshold, windowSec, cooldownSec } = config.scannerDetection;

    const recentRequests = stateService.getRecentRequestsByIp(event.ip, windowSec);

    // Count distinct paths this IP scanned
    const distinctPaths = new Set(recentRequests.filter(e => e.path).map(e => e.path));

    if (distinctPaths.size >= threshold) {
        return {
            type: 'SCANNER_DETECTED',
            severity: 'HIGH',
            ip: event.ip,
            message: `Automated scanner or bot detected — rapid multi-path probing from single IP`,
            evidence: {
                distinctPathsProbed: distinctPaths.size,
                windowSeconds: windowSec,
                samplePaths: [...distinctPaths].slice(0, 5)
            },
            dedupeKey: `SCANNER_DETECTED:${event.ip}`,
            cooldownSeconds: cooldownSec
        };
    }

    return null;
};

module.exports = { evaluate };
