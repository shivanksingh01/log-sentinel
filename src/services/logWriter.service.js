const fs = require('fs');
const path = require('path');
const { createLogger, transports, format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const logger = require('../config/logger');
const env = require('../config/env');

const LOG_DIR = env.LOG_DIR;

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

// Setup a separate winston logger precisely for raw application events.
// It will write exactly the string we give it, with no extra JSON overhead.
const rawFormatter = format.printf(({ message }) => {
    return message;
});

const appLogTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD-HH', // Hourly rotation
    zippedArchive: true,
    maxSize: '20m', // Rotate if file exceeds 20MB even within the hour
    maxFiles: '14d', // Keep logs for 14 days
});

// We want to catch daily-rotate-file events if possible, but keeping it simple is best.
appLogTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info(`[LOG_WRITER] Rotated application log from ${oldFilename} to ${newFilename}`);
});

const appLogger = createLogger({
    level: 'info',
    format: rawFormatter,
    transports: [
        appLogTransport
    ]
});

/**
 * Write a structured log line to rotated hourly log files.
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

    // Write raw message
    appLogger.info(logLine);
};

module.exports = {
    writeLog,
    LOG_DIR,
};
