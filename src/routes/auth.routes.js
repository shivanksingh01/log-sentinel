const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');
const { writeLog } = require('../services/logWriter.service');

// Hardcoded credentials for demo purposes
const DEMO_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
};

/**
 * POST /api/v1/auth/login
 * 
 * Demo login endpoint.
 * Logs FAILED_LOGIN or LOGIN_SUCCESS to /logs/app.log
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '0.0.0.0';

    if (!username || !password) {
        writeLog({
            event: 'FAILED_LOGIN',
            ip: clientIp,
            user: username || 'unknown',
            path: '/auth/login',
            status: 400,
            method: 'POST',
        });

        return ApiResponse.badRequest(res, 'Username and password are required');
    }

    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        writeLog({
            event: 'LOGIN_SUCCESS',
            ip: clientIp,
            user: username,
            path: '/auth/login',
            status: 200,
            method: 'POST',
        });

        return ApiResponse.success(res, {
            token: 'demo-jwt-token-placeholder',
        }, 'Login successful');
    }

    // Invalid credentials
    writeLog({
        event: 'FAILED_LOGIN',
        ip: clientIp,
        user: username,
        path: '/auth/login',
        status: 401,
        method: 'POST',
    });

    return ApiResponse.unauthorized(res, 'Invalid credentials');
});

module.exports = router;
