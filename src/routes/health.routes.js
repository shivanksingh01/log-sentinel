const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');

router.get('/', (req, res) => {
    return ApiResponse.success(res, {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    }, 'OK', 200);
});

module.exports = router;
