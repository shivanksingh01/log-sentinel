const alertService = require('../services/alert.service');
const sseService = require('../services/sse.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get all alerts
 */
const getAllAlerts = (req, res) => {
    const filters = {
        severity: req.query.severity,
        type: req.query.type,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    const alerts = alertService.getAllAlerts(filters);
    return res.status(200).json(alerts);
};

/**
 * Stream alerts in real time using SSE
 */
const streamAlerts = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = `client_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    sseService.addClient(clientId, res);

    req.on('close', () => {
        sseService.removeClient(clientId);
    });
};

/**
 * Get latest alerts
 */
const getLatestAlerts = (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const alerts = alertService.getLatestAlerts(limit);
    return res.status(200).json(alerts);
};

/**
 * Get alert summary
 */
const getAlertSummary = (req, res) => {
    const summary = alertService.getAlertSummary();
    return res.status(200).json(summary);
};

module.exports = {
    getAllAlerts,
    streamAlerts,
    getLatestAlerts,
    getAlertSummary,
};
