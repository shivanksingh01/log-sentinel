const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { startWatcher, stopWatcher } = require('./services/watcher.service');

const LOG_SENTINEL_BANNER = `
  _                 ____             _   _            _ 
 | |               / ___|           | | (_)          | |
 | |     ___   __ _\\___ \\  ___ _ __ | |_ _ _ __   ___| |
 | |    / _ \\ / _\` |___) |/ _ \\ '_ \\| __| | '_ \\ / _ \\ |
 | |___| (_) | (_| |____/|  __/ | | | |_| | | | |  __/ |
 |______\\___/ \\__, |     \\___|_| |_|\\__|_|_| |_|\\___|_|
               __/ |                                    
              |___/                                     
`;

const startServer = async () => {
    try {
        const server = app.listen(env.PORT, '0.0.0.0', () => {
            console.log(LOG_SENTINEL_BANNER);
            
            const startupInfo = [
                { Metric: 'App Name', Value: 'Log Sentinel' },
                { Metric: 'Environment', Value: env.NODE_ENV },
                { Metric: 'Port', Value: env.PORT },
                { Metric: 'Health Check', Value: `http://localhost:${env.PORT}/api/v1/health` }
            ];
            
            console.table(startupInfo);

            logger.info(`API running on port ${env.PORT}`);

            // Start the file watcher for /logs directory
            startWatcher();
        });

        const gracefulShutdown = (signal) => {
            logger.warn(`${signal} received. Shutting down gracefully...`);
            stopWatcher();
            server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });

            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        process.on('unhandledRejection', (err) => {
            logger.error('Unhandled Rejection:', err);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
