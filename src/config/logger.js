const { createLogger, format, transports } = require('winston');
const env = require('./env');

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
    defaultMeta: { service: 'backend-boilerplate' },
    transports: [
        new transports.Console(),
    ],
});

module.exports = logger;
