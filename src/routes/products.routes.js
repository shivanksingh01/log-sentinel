const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');
const { writeLog } = require('../services/logWriter.service');

// Demo product data
const PRODUCTS = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Phone', price: 699 },
    { id: 3, name: 'Tablet', price: 449 },
    { id: 4, name: 'Monitor', price: 329 },
];

/**
 * GET /api/v1/products
 * 
 * Returns demo product list.
 * Logs a REQUEST event to /logs/app.log
 */
router.get('/', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || '0.0.0.0';

    writeLog({
        event: 'REQUEST',
        ip: clientIp,
        path: '/products',
        status: 200,
        method: 'GET',
    });

    return ApiResponse.success(res, PRODUCTS, 'Products retrieved successfully');
});

module.exports = router;
