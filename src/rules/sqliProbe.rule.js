const config = require('../config/detection');

/**
 * SQL Injection Probe Detection Rule
 * Detects HTTP requests containing SQL injection signatures in the request path.
 * Covers common UNION-based, boolean-based, time-based, and error-based SQLi patterns.
 */
const SQLI_PATTERNS = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /'\s*(OR|AND)\s*'?\d/i,
    /--\s*$/, /;\s*--/, /\/\*.*\*\//,
    /%27|%22/, // URL-encoded quotes
    /1=1|1%3D1/i,
    /sleep\(\d+\)/i, /benchmark\(\d+/i, /waitfor\s+delay/i,
    /xp_cmdshell/i, /information_schema/i, /sysobjects/i,
    /load_file\(/i, /into\s+outfile/i
];

const evaluate = (event, stateService) => {
    if (!event.path || !event.ip) return null;
    // Allow UNKNOWN to support unstructured generic logs from volume mounts
    if (!['GET', 'POST', 'PUT', 'DELETE', 'UNKNOWN'].includes(event.method)) return null;

    const { cooldownSec } = config.sqliProbe;
    const pathDecoded = decodeURIComponent(event.path);

    const matched = SQLI_PATTERNS.some(p => p.test(pathDecoded) || p.test(event.path));
    if (!matched) return null;

    return {
        type: 'SQL_INJECTION_PROBE',
        severity: 'HIGH',
        ip: event.ip,
        user: event.user,
        message: `SQL injection probe detected in request path: ${event.path}`,
        evidence: {
            path: event.path,
            method: event.method,
            status: event.status
        },
        dedupeKey: `SQL_INJECTION_PROBE:${event.ip}`,
        cooldownSeconds: cooldownSec
    };
};

module.exports = { evaluate };
