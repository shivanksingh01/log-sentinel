const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const ApiResponse = require('./utils/ApiResponse');
const errorHandler = require('./middlewares/errorHandler');

// Routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');
const adminRoutes = require('./routes/admin.routes');
const statsRoutes = require('./routes/stats.routes');
const alertRoutes = require('./routes/alert.routes');

const app = express();

app.set('trust proxy', 1); // standard for rate Limiter behind proxy

app.use(cors());
app.use(helmet());
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (!env.isProd) {
    app.use(morgan('dev'));
}

// Sub-router Registration
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/alerts', alertRoutes);

// 404 Handler
app.use((req, res) => {
    ApiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
