const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts
 */
router.get('/', alertController.getAllAlerts);

/**
 * @route   GET /api/v1/alerts/stream
 * @desc    Stream alerts in real time setup via SSE
 */
router.get('/stream', alertController.streamAlerts);

/**
 * @route   GET /api/v1/alerts/latest
 * @desc    Get latest alerts
 */
router.get('/latest', alertController.getLatestAlerts);

/**
 * @route   GET /api/v1/alerts/summary
 * @desc    Get alert summary (counts by type, severity)
 */
router.get('/summary', alertController.getAlertSummary);

module.exports = router;
