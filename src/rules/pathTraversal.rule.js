const config = require('../config/detection');

/**
 * Path Traversal / Directory Traversal Detection Rule
 * Detects requests attempting to access parent directories or sensitive system paths.
 * Common attack pattern: GET /../../etc/passwd, /../windows/system32, etc.
 */
const TRAVERSAL_PATTERNS = [
    /\.\.\//, /\.\.\\/, /%2e%2e/i, /%252e/i,
    /\/etc\/passwd/, /\/etc\/shadow/, /\/proc\/self/,
    /windows\\system32/i, /windows\/system32/i,
    /boot\.ini/i, /win\.ini/i
];

const evaluate = (event, stateService) => {
    if (!event.path || !event.ip) return null;

    const { cooldownSec } = config.pathTraversal;
    let pathDecoded = event.path;
    try {
        pathDecoded = decodeURIComponent(event.path);
    } catch (e) {
        // Ignored: Malformed URI components shouldn't bypass detection
    }

    const matched = TRAVERSAL_PATTERNS.some(p => p.test(pathDecoded) || p.test(event.path));
    if (!matched) return null;

    return {
        type: 'PATH_TRAVERSAL_ATTEMPT',
        severity: 'HIGH',
        ip: event.ip,
        user: event.user,
        message: `Path traversal attempt detected on path: ${event.path}`,
        evidence: {
            path: event.path,
            method: event.method
        },
        dedupeKey: `PATH_TRAVERSAL_ATTEMPT:${event.ip}`,
        cooldownSeconds: cooldownSec
    };
};

module.exports = { evaluate };
