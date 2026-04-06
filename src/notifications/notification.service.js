const webhookNotifier = require('./webhookNotifier');
const emailNotifier = require('./emailNotifier');
const logger = require('../config/logger');

class NotificationService {
    /**
     * Orchestrate notifications asynchronously ensuring failures do not break main flow.
     */
    async notify(alert) {
        try {
            const tasks = [
                webhookNotifier.send(alert).catch(err => {
                    logger.error(`[NOTIFY][ERROR] Webhook task failed: ${err.message}`);
                })
            ];

            if (alert.severity === 'HIGH') {
                tasks.push(
                    emailNotifier.sendCriticalAlert(alert).catch(err => {
                        logger.error(`[NOTIFY][ERROR] Email task failed: ${err.message}`);
                    })
                );
            }

            // Using Promise.all without awaiting to ensure non-blocking fire-and-forget
            Promise.all(tasks).catch(() => {});
        } catch (error) {
            logger.error(`[NOTIFY][ERROR] Notification orchestration failed: ${error.message}`);
        }
    }
}

module.exports = new NotificationService();
