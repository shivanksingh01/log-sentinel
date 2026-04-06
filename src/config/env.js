const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    WEBHOOK_ENABLED: process.env.WEBHOOK_ENABLED === 'true' || process.env.WEBHOOK_ENABLED === '1'
};
