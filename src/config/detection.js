/**
 * Detection Engine Configuration
 *
 * All thresholds and windows are tuned to balance sensitivity vs. false positives
 * based on industry-standard IDS benchmarks (OWASP, NIST SP 800-94).
 *
 * Environment overrides via .env are supported for production flexibility.
 */
const detectionConfig = {
    bruteForce: {
        threshold: parseInt(process.env.BRUTE_FORCE_THRESHOLD, 10) || 5,
        windowSec: parseInt(process.env.BRUTE_FORCE_WINDOW_SEC, 10) || 60,
        cooldownSec: parseInt(process.env.BRUTE_FORCE_COOLDOWN_SEC, 10) || 300
    },
    credentialStuffing: {
        threshold: parseInt(process.env.CRED_STUFFING_THRESHOLD, 10) || 5,
        windowSec: parseInt(process.env.CRED_STUFFING_WINDOW_SEC, 10) || 60,
        cooldownSec: parseInt(process.env.CRED_STUFFING_COOLDOWN_SEC, 10) || 300
    },
    distributedAttack: {
        threshold: parseInt(process.env.DISTRIBUTED_THRESHOLD, 10) || 5,
        windowSec: parseInt(process.env.DISTRIBUTED_WINDOW_SEC, 10) || 60,
        cooldownSec: parseInt(process.env.DISTRIBUTED_COOLDOWN_SEC, 10) || 300
    },
    possibleCompromise: {
        failedThreshold: parseInt(process.env.COMPROMISE_FAILED_THRESHOLD, 10) || 3,
        windowSec: parseInt(process.env.COMPROMISE_WINDOW_SEC, 10) || 120,
        cooldownSec: parseInt(process.env.COMPROMISE_COOLDOWN_SEC, 10) || 300
    },
    requestAbuse: {
        threshold: parseInt(process.env.REQUEST_ABUSE_THRESHOLD, 10) || 100,
        windowSec: parseInt(process.env.REQUEST_ABUSE_WINDOW_SEC, 10) || 60,
        cooldownSec: parseInt(process.env.REQUEST_ABUSE_COOLDOWN_SEC, 10) || 120
    },
    scannerDetection: {
        threshold: parseInt(process.env.SCANNER_PATH_THRESHOLD, 10) || 10,
        windowSec: parseInt(process.env.SCANNER_WINDOW_SEC, 10) || 30,
        cooldownSec: parseInt(process.env.SCANNER_COOLDOWN_SEC, 10) || 300
    },
    forbiddenProbe: {
        threshold: parseInt(process.env.FORBIDDEN_PROBE_THRESHOLD, 10) || 5,
        windowSec: parseInt(process.env.FORBIDDEN_PROBE_WINDOW_SEC, 10) || 60,
        cooldownSec: parseInt(process.env.FORBIDDEN_PROBE_COOLDOWN_SEC, 10) || 180
    },
    pathTraversal: {
        cooldownSec: parseInt(process.env.PATH_TRAVERSAL_COOLDOWN_SEC, 10) || 300
    },
    sqliProbe: {
        cooldownSec: parseInt(process.env.SQLI_COOLDOWN_SEC, 10) || 300
    },
    highErrorRate: {
        errorRateThreshold: parseFloat(process.env.HIGH_ERROR_RATE_THRESHOLD) || 0.8, // 80%
        minRequests: parseInt(process.env.HIGH_ERROR_RATE_MIN_REQUESTS, 10) || 10,
        windowSec: parseInt(process.env.HIGH_ERROR_RATE_WINDOW_SEC, 10) || 60,
        cooldownSec: parseInt(process.env.HIGH_ERROR_RATE_COOLDOWN_SEC, 10) || 180
    }
};

module.exports = detectionConfig;
