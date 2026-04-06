const fsPromises = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

const DATA_DIR = path.join(__dirname, '../../data');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

class FileStoreService {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            await fsPromises.mkdir(DATA_DIR, { recursive: true });
            try {
                await fsPromises.access(ALERTS_FILE);
            } catch {
                await fsPromises.writeFile(ALERTS_FILE, ''); // Using NDJSON line-by-line format
            }
            this.initialized = true;
            logger.info('[PERSISTENCE] FileStoreService initialized at data/alerts.json');
        } catch (error) {
            logger.error(`[PERSISTENCE] Failed to initialize file store: ${error.message}`);
        }
    }

    async saveAlert(alert) {
        if (!this.initialized) await this.init();
        try {
            const line = JSON.stringify(alert) + '\n';
            await fsPromises.appendFile(ALERTS_FILE, line);
        } catch (error) {
            logger.error(`[PERSISTENCE][ERROR] Failed to save alert: ${error.message}`);
        }
    }
}

module.exports = new FileStoreService();
