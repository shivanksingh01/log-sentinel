const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

// Resolve log directory:
// 1. Use LOG_DIR env var if explicitly set
// 2. Fall back to /logs (Docker volume mount standard per spec)
// 3. Fall back to ./logs (local development)
const resolveLogDir = () => {
    if (process.env.LOG_DIR) return process.env.LOG_DIR;
    if (fs.existsSync('/logs')) return '/logs'; // Docker volume mount
    return path.resolve(process.cwd(), 'logs');  // Local dev fallback
};

module.exports = {
    PORT: parseInt(process.env.PORT, 10) || 8080,
    NODE_ENV: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    WEBHOOK_ENABLED: process.env.WEBHOOK_ENABLED === 'true' || process.env.WEBHOOK_ENABLED === '1',
    LOG_DIR: resolveLogDir(),
    // When true: scan entire existing file content on startup (for mounted log files)
    // Automatically true when /logs is used (external mount scenario)
    LOG_SCAN_FROM_START: process.env.LOG_SCAN_FROM_START === 'true' || fs.existsSync('/logs'),
    
    // Email config
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    EMAIL_API_BASE_URL: process.env.EMAIL_API_BASE_URL || 'https://api.resend.com',
    EMAIL_FROM: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    EMAIL_TO: process.env.EMAIL_TO || ''
};
