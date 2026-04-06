const ApiResponse = require('../utils/ApiResponse');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Request error', {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode || 500,
    });

    if (err.name === 'SyntaxError' && err.status === 400) {
        return ApiResponse.badRequest(res, 'Invalid JSON in request body');
    }

    return ApiResponse.error(
        res,
        err.message || 'Internal Server Error',
        err.statusCode || 500
    );
};

module.exports = errorHandler;
