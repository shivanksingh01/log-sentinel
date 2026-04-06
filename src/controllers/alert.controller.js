const alertService = require('../services/alert.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get all alerts
 */
const getAllAlerts = (req, res) => {
    const alerts = alertService.getAllAlerts();
    return res.status(200).json(alerts);
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
    getLatestAlerts,
    getAlertSummary,
};
