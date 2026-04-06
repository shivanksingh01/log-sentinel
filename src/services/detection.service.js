const stateService = require('./state.service');
const alertService = require('./alert.service');

const bruteForceRule = require('../rules/bruteForce.rule');
const credentialStuffingRule = require('../rules/credentialStuffing.rule');
const distributedAttackRule = require('../rules/distributedAttack.rule');
const failThenSuccessRule = require('../rules/failThenSuccess.rule');
const requestAbuseRule = require('../rules/requestAbuse.rule');
const pathTraversalRule = require('../rules/pathTraversal.rule');
const sqliProbeRule = require('../rules/sqliProbe.rule');
const scannerDetectionRule = require('../rules/scannerDetection.rule');
const forbiddenProbeRule = require('../rules/forbiddenProbe.rule');
const highErrorRateRule = require('../rules/highErrorRate.rule');

/**
 * Ordered rule registry.
 *
 * Rules are evaluated in order for each event. All rules are independent —
 * a single event can trigger multiple alerts. We separate path/injection
 * rules first so high-confidence signature matches fire before behavioral ones.
 */
const rules = [
    // Signature-based (high confidence, immediate)
    pathTraversalRule,
    sqliProbeRule,

    // Behavioral (accumulate over time windows)
    bruteForceRule,
    credentialStuffingRule,
    distributedAttackRule,
    failThenSuccessRule,

    // Volume / rate based
    requestAbuseRule,
    scannerDetectionRule,
    forbiddenProbeRule,
    highErrorRateRule
];

class DetectionService {
    /**
     * Route a normalized event through the full detection rule chain.
     * @param {Object} event
     */
    processEvent(event) {
        if (!event) return;

        // 1. Update sliding-window state
        stateService.addEvent(event);

        // 2. Evaluate every rule — multiple alerts possible per event
        for (const rule of rules) {
            try {
                const alertData = rule.evaluate(event, stateService);
                if (alertData) {
                    alertService.createAlert(alertData, alertData.cooldownSeconds);
                }
            } catch (err) {
                // Rule errors must never kill the pipeline
                const ruleName = rule.constructor?.name || 'unknown';
                require('../config/logger').error(`[DETECTION][ERROR] Rule evaluation failed: ${err.message}`);
            }
        }
    }
}

module.exports = new DetectionService();
