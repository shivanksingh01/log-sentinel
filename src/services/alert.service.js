const Alert = require('../models/Alert');
const logger = require('../config/logger');
const statsService = require('./stats.service');

class AlertService {
    constructor() {
        /** @type {Array<Alert>} */
        this.alerts = [];
        this.alertCounter = 0;
        
        /** @type {Map<string, number>} */
        this.lastAlertTimestampMap = new Map();
    }

    /**
     * @param {Object} alertData
     * @param {number} cooldownSeconds
     */
    createAlert(alertData, cooldownSeconds = 300) {
        const { type, severity, ip, user, message, evidence, dedupeKey } = alertData;

        // Deduplication check
        if (this.shouldSuppressAlert(dedupeKey, cooldownSeconds)) {
            statsService.incrementAlertsSuppressed();
            logger.info(`[ALERT][SUPPRESSED] ${dedupeKey}`);
            return null;
        }

        this.alertCounter++;
        const alertId = `alert_${this.alertCounter.toString().padStart(3, '0')}`;
        
        const alert = new Alert({
            id: alertId,
            type,
            severity,
            ip,
            user,
            message,
            evidence,
            dedupeKey
        });

        this.alerts.push(alert);
        this.lastAlertTimestampMap.set(dedupeKey, Date.now());
        
        statsService.incrementAlertsCreated();
        
        // Use ip=... logic as per requirement: "[ALERT][MEDIUM][BRUTE_FORCE_LOGIN] ip=1.2.3.4 failedAttempts=6"
        let logMsg = `[ALERT][${severity}][${type}]`;
        if (ip) logMsg += ` ip=${ip}`;
        if (user) logMsg += ` user=${user}`;
        
        const evidenceEntries = Object.entries(evidence || {}).map(([k, v]) => `${k}=${v}`).join(' ');
        if (evidenceEntries) logMsg += ` ${evidenceEntries}`;
        
        logger.warn(logMsg);

        return alert;
    }

    /**
     * @param {string} dedupeKey 
     * @param {number} cooldownSeconds 
     * @returns {boolean}
     */
    shouldSuppressAlert(dedupeKey, cooldownSeconds) {
        if (!dedupeKey) return false;
        
        const lastTimestamp = this.lastAlertTimestampMap.get(dedupeKey);
        if (!lastTimestamp) return false;

        const timeSinceLastAlert = (Date.now() - lastTimestamp) / 1000;
        return timeSinceLastAlert < cooldownSeconds;
    }

    getAllAlerts() {
        return this.alerts;
    }

    getLatestAlerts(limit = 10) {
        // Return latest first
        return [...this.alerts].reverse().slice(0, limit);
    }

    getAlertSummary() {
        const summary = {
            totalAlerts: this.alerts.length,
            byType: {},
            bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0 }
        };

        for (const alert of this.alerts) {
            summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
            summary.bySeverity[alert.severity] = (summary.bySeverity[alert.severity] || 0) + 1;
        }

        return summary;
    }
}

module.exports = new AlertService();
