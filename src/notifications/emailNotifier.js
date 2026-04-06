const logger = require('../config/logger');

class EmailNotifier {
    async sendCriticalAlert(alert) {
        if (alert.severity !== 'HIGH') return;

        try {
            const subject = '🚨 Intrusion Alert: Possible Compromise';
            const body = `
Alert Type: ${alert.type}
Severity: ${alert.severity}
IP: ${alert.ip || 'N/A'}
User: ${alert.user || 'N/A'}
Timestamp: ${new Date().toISOString()}
Summary: ${alert.message}
            `.trim();

            // Simulate an async provider logic (e.g. Resend, Sendgrid)
            await new Promise(resolve => setTimeout(resolve, 50));

            logger.info(`[EMAIL] Sent HIGH severity alert for ${alert.id}`);
            
            // In a real environment, uncomment to see the payload
            // console.log(`[EMAIL CONTENT]\nSubject: ${subject}\nBody:\n${body}\n`);
        } catch (error) {
             logger.error(`[EMAIL][ERROR] Failed to send email for alert ${alert.id}: ${error.message}`);
        }
    }
}

module.exports = new EmailNotifier();
