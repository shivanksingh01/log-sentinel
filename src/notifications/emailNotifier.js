const logger = require('../config/logger');
const axios = require('axios');
const env = require('../config/env');

class EmailNotifier {
    async sendCriticalAlert(alert) {
        if (alert.severity !== 'HIGH') return;

        try {
            const subject = 'Intrusion Alert: Possible Compromise';
            const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
    <div style="background: linear-gradient(135deg, #da3633 0%, #f85149 100%); padding: 24px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Intrusion Alert Detected</h1>
    </div>
    <div style="padding: 32px;">
      <p style="margin-top: 0; margin-bottom: 24px; font-size: 16px; line-height: 1.5; color: #8b949e;">
        Log Sentinel has automatically blocked and flagged a high-severity security event. Immediate review is recommended.
      </p>
      <div style="background-color: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 16px;">
        <div style="margin-bottom: 12px; border-bottom: 1px solid #21262d; padding-bottom: 12px;">
          <span style="font-size: 12px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Type</span><br>
          <strong style="font-size: 16px; color: #ff7b72;">${alert.type}</strong>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
          <tr>
            <td width="50%" valign="top">
              <span style="font-size: 12px; color: #8b949e; text-transform: uppercase;">Severity</span><br>
              <strong style="color: #c9d1d9;">${alert.severity}</strong>
            </td>
            <td width="50%" valign="top">
              <span style="font-size: 12px; color: #8b949e; text-transform: uppercase;">IP Address</span><br>
              <strong style="color: #c9d1d9;">${alert.ip || 'N/A'}</strong>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" valign="top">
              <span style="font-size: 12px; color: #8b949e; text-transform: uppercase;">User</span><br>
              <strong style="color: #c9d1d9;">${alert.user || 'N/A'}</strong>
            </td>
            <td width="50%" valign="top">
              <span style="font-size: 12px; color: #8b949e; text-transform: uppercase;">Time</span><br>
              <strong style="color: #c9d1d9;">${new Date().toISOString()}</strong>
            </td>
          </tr>
        </table>
      </div>
      <div style="margin-top: 24px;">
        <h3 style="font-size: 14px; color: #8b949e; text-transform: uppercase; margin-bottom: 8px;">Event Summary</h3>
        <div style="background-color: #0d1117; border-left: 3px solid #f85149; padding: 12px 16px; border-radius: 0 4px 4px 0; color: #c9d1d9; font-family: monospace; font-size: 14px; word-break: break-all;">
          ${alert.message}
        </div>
      </div>
    </div>
    <div style="background-color: #0d1117; padding: 24px 32px; text-align: center; border-top: 1px solid #30363d;">
      <p style="margin: 0; font-size: 12px; color: #8b949e;">
        Generated automatically by Log Sentinel. Do not reply.
      </p>
    </div>
  </div>
</body>
</html>
            `;

            const apiKey = env.RESEND_API_KEY;
            const apiUrl = `${env.EMAIL_API_BASE_URL}/emails`;
            const fromEmail = env.EMAIL_FROM;
            const toEmail = env.EMAIL_TO;

            if (!apiKey || !toEmail) {
                logger.warn('[EMAIL] RESEND_API_KEY or EMAIL_TO is not set. Skipping real email send.');
                return;
            }

            await axios.post(
                apiUrl,
                {
                    from: fromEmail,
                    to: toEmail,
                    subject: subject,
                    html: html
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info(`[EMAIL] Sent HIGH severity alert for ${alert.id} using Resend`);
        } catch (error) {
             logger.error(`[EMAIL][ERROR] Failed to send email for alert ${alert.id}: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
        }
    }
}

module.exports = new EmailNotifier();
