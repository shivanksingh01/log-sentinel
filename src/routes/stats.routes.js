const express = require('express');
const router = express.Router();
const statsService = require('../services/stats.service');

router.get('/', (req, res) => {
    const stats = statsService.getStats();
    return res.status(200).json(stats);
});

module.exports = router;
