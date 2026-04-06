const logger = require('../config/logger');

class SSEService {
    constructor() {
        /** @type {Map<string, import('express').Response>} */
        this.clients = new Map();
    }

    addClient(clientId, res) {
        this.clients.set(clientId, res);
        logger.info(`[SSE] Client connected: ${clientId}`);
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        logger.info(`[SSE] Client disconnected: ${clientId}`);
    }

    broadcastAlert(alert) {
        if (this.clients.size === 0) return;
        
        // As per Step 5 design: "event: alert\ndata: <json>\n\n"
        // Also print observing log
        logger.info(`[SSE] Alert broadcasted: ${alert.type}`);
        
        const payload = `event: alert\ndata: ${JSON.stringify(alert)}\n\n`;
        
        this.clients.forEach((clientRes, clientId) => {
            try {
                clientRes.write(payload);
                // Specifically force the Express 'compression' middleware to flush buffers
                if (typeof clientRes.flush === 'function') {
                    clientRes.flush();
                }
            } catch (err) {
                logger.error(`[SSE] Failed to broadcast to client ${clientId}: ${err.message}`);
                this.removeClient(clientId);
            }
        });
    }

    sendHeartbeat() {
        if (this.clients.size === 0) return;
        
        const payload = `event: ping\ndata: {"time":${Date.now()}}\n\n`;
        this.clients.forEach(clientRes => {
            try {
                clientRes.write(payload);
                if (typeof clientRes.flush === 'function') {
                    clientRes.flush();
                }
            } catch (err) {
                // Ignore errors for heartbeat, rely on 'close' event from request to remove clients
            }
        });
    }
}

const sseService = new SSEService();

// Optional keepalive event to prevent idle disconnects
setInterval(() => sseService.sendHeartbeat(), 30000).unref();

module.exports = sseService;
