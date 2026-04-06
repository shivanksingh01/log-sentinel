const stateService = require('./state.service');
const alertService = require('./alert.service');

const bruteForceRule = require('../rules/bruteForce.rule');
const credentialStuffingRule = require('../rules/credentialStuffing.rule');
const distributedAttackRule = require('../rules/distributedAttack.rule');
const failThenSuccessRule = require('../rules/failThenSuccess.rule');
const requestAbuseRule = require('../rules/requestAbuse.rule');

const rules = [
    bruteForceRule,
    credentialStuffingRule,
    distributedAttackRule,
    failThenSuccessRule,
    requestAbuseRule
];

class DetectionService {
    /**
     * Process a normalized event through the detection engine.
     * @param {Object} event 
     */
    processEvent(event) {
        if (!event) return;

        // 1. Update in-memory state
        stateService.addEvent(event);

        // 2. Evaluate all rules
        for (const rule of rules) {
            const alertData = rule.evaluate(event, stateService);
            
            if (alertData) {
                // 3. Create alert if rule matches
                alertService.createAlert(alertData, alertData.cooldownSeconds);
            }
        }
    }
}

module.exports = new DetectionService();
