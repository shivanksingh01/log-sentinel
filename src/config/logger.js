const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const env = require('./env');

const LOG_DIR = env.LOG_DIR || path.join(process.cwd(), 'logs');

// System logs rotation
const systemTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'system-%DATE%.log'),
    datePattern: 'YYYY-MM-DD-HH', // Hourly rotation
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
});

// System error logs rotation
const errorTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    level: 'error',
    datePattern: 'YYYY-MM-DD-HH', // Hourly rotation
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
});

const logger = createLogger({
    level: env.isProd ? 'info' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        env.isProd
            ? format.json()
            : format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                })
            )
    ),
    defaultMeta: { service: 'log-sentinel' },
    transports: [
        new transports.Console(),
        systemTransport,
        errorTransport
    ],
});

module.exports = logger;
