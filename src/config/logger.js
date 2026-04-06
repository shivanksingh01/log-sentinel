const { createLogger, format, transports, addColors } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const env = require('./env');

const LOG_DIR = env.LOG_DIR || path.join(process.cwd(), 'logs');

// Custom levels to support "critical" alongside standard NPM levels
const customLevels = {
    levels: {
        critical: 0,
        error: 1,
        warn: 2,
        info: 3,
        http: 4,
        verbose: 5,
        debug: 6,
        silly: 7
    },
    colors: {
        critical: 'bold white redBG',
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'cyan',
        verbose: 'blue',
        debug: 'magenta',
        silly: 'gray'
    }
};

addColors(customLevels.colors);

// Info wrapper transport (Catches info and below, e.g., info, warn, error, critical)
const infoTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'info-%DATE%.log'),
    level: 'info',
    datePattern: 'YYYY-MM-DD-HH', // Hourly rotation
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
});

// Error transport (Catches error and critical)
const errorTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    level: 'error',
    datePattern: 'YYYY-MM-DD-HH', 
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
});

// Critical transport (Catches only critical)
const criticalTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'critical-%DATE%.log'),
    level: 'critical',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
});

const logger = createLogger({
    levels: customLevels.levels,
    level: env.isProd ? 'info' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        env.isProd
            ? format.json()
            : format.combine(
                format.colorize({ all: true }),
                format.printf(({ timestamp, level, message, ...meta }) => {
                    // Extract stack if an error was passed directly
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                })
            )
    ),
    defaultMeta: { service: 'log-sentinel' },
    transports: [
        new transports.Console(),
        infoTransport,
        errorTransport,
        criticalTransport
    ],
});

module.exports = logger;
