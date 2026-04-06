const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');
const { writeLog } = require('../services/logWriter.service');

/**
 * GET /api/v1/admin
 * 
 * Demo restricted admin endpoint.
 * Always returns 403 Forbidden.
 * Logs the access attempt to /logs/app.log
 */
router.get('/', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || '0.0.0.0';

    writeLog({
        event: 'REQUEST',
        ip: clientIp,
        path: '/admin',
        status: 403,
        method: 'GET',
    });

    return ApiResponse.error(res, 'Forbidden', 403);
});

module.exports = router;
