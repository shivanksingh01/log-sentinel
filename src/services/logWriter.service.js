const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

/**
 * Ensure /logs directory exists
 */
const ensureLogDir = () => {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        logger.info(`[LOG_WRITER] Created log directory: ${LOG_DIR}`);
    }
};

// Initialize on load
ensureLogDir();

/**
 * Write a structured log line to /logs/app.log
 * 
 * @param {Object} params
 * @param {string} params.event      - Event type (e.g. FAILED_LOGIN, LOGIN_SUCCESS, REQUEST)
 * @param {string} params.ip         - Client IP address
 * @param {string} [params.user]     - Username (optional, for auth events)
 * @param {string} params.path       - Request path
 * @param {number} params.status     - HTTP status code
 * @param {string} params.method     - HTTP method (GET, POST, etc.)
 */
const writeLog = ({ event, ip, user, path: reqPath, status, method }) => {
    const timestamp = new Date().toISOString();

    let logLine = `${timestamp} event=${event} ip=${ip}`;

    if (user) {
        logLine += ` user=${user}`;
    }

    logLine += ` path=${reqPath} status=${status} method=${method}`;

    // Append to file with newline
    try {
        fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf-8');
    } catch (err) {
        logger.error(`[LOG_WRITER] Failed to write log: ${err.message}`);
    }
};

module.exports = {
    writeLog,
    LOG_DIR,
    LOG_FILE,
};
