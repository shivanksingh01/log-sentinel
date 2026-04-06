const logger = require('../config/logger');
const env = require('../config/env');

class WebhookNotifier {
    constructor() {
        // Optional webhook URL via environment variable
        this.webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/mock/webhook';
    }

    async send(alert) {
        // Gate check if webhooks are enabled via .env
        if (!env.WEBHOOK_ENABLED) return;

        try {
            // Ensure no missing URL breaks execution
            if (!this.webhookUrl) return;

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
            });

            if (response.ok) {
                logger.info(`[NOTIFY] Webhook sent for alert ${alert.id}`);
            } else {
                logger.warn(`[NOTIFY][ERROR] Webhook failed for alert ${alert.id} with status ${response.status}`);
            }
        } catch (error) {
            // Network failures shouldn't throw error upwards
            logger.error(`[NOTIFY][ERROR] Webhook failed for alert ${alert.id}: ${error.message}`);
        }
    }
}

module.exports = new WebhookNotifier();
