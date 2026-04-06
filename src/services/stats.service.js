// In-memory stats
const stats = {
    logsProcessed: 0,
    filesWatched: 1, // Currently only watching app.log
    parseErrors: 0,
    alertsCreated: 0,
    alertsSuppressed: 0,
};

const incrementLogsProcessed = () => {
    stats.logsProcessed += 1;
};

const incrementParseErrors = () => {
    stats.parseErrors += 1;
};

const incrementAlertsCreated = () => {
    stats.alertsCreated += 1;
};

const incrementAlertsSuppressed = () => {
    stats.alertsSuppressed += 1;
};

const getStats = () => {
    return { ...stats };
};

module.exports = {
    incrementLogsProcessed,
    incrementParseErrors,
    incrementAlertsCreated,
    incrementAlertsSuppressed,
    getStats,
};
