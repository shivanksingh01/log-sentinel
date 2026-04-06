const logger = require('../config/logger');

/**
 * StateService
 *
 * In-memory time-windowed event tracking for the detection engine.
 * Maps are pruned periodically (GC interval) to prevent unbounded memory growth.
 * All lookups filter by a sliding time window to ensure recency.
 */
class StateService {
    constructor() {
        /** @type {Map<string, Array<any>>} */
        this.failedLoginsByIp = new Map();

        /** @type {Map<string, Array<any>>} */
        this.failedLoginsByUser = new Map();

        /** @type {Map<string, Array<any>>} */
        this.requestsByIp = new Map();

        /** @type {Map<string, Array<any>>} */
        this.recentFailuresByIpUser = new Map();

        // Garbage collect stale entries every 5 minutes
        this._gcInterval = setInterval(() => this._runGC(), 5 * 60 * 1000).unref();
    }

    /**
     * Ingest a parsed event into all relevant state buckets.
     * @param {Object} event
     */
    addEvent(event) {
        if (!event || !event.timestamp) return;

        const isFailedLogin = event.eventType === 'FAILED_LOGIN';
        const isRequest = event.eventType === 'REQUEST';

        if (isFailedLogin) {
            if (event.ip) this._addToList(this.failedLoginsByIp, event.ip, event);
            if (event.user) this._addToList(this.failedLoginsByUser, event.user, event);
            if (event.ip && event.user) {
                const key = `${event.ip}:${event.user}`;
                this._addToList(this.recentFailuresByIpUser, key, event);
            }
        }

        // All request types (including failures) get tracked for rate/error/scanner analysis
        if (event.ip) {
            this._addToList(this.requestsByIp, event.ip, event);
        }
    }

    _addToList(map, key, event) {
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(event);
    }

    /**
     * Returns events within the last N seconds from a given map bucket.
     * Prunes stale events in place (lazy GC).
     */
    _getRecent(map, key, windowSeconds) {
        const events = map.get(key) || [];
        const cutoffTime = Date.now() - windowSeconds * 1000;
        const recentEvents = events.filter(e => new Date(e.timestamp).getTime() >= cutoffTime);
        map.set(key, recentEvents); // inline pruning
        return recentEvents;
    }

    getRecentFailedLoginsByIp(ip, windowSeconds) {
        return this._getRecent(this.failedLoginsByIp, ip, windowSeconds);
    }

    getRecentFailedLoginsByUser(user, windowSeconds) {
        return this._getRecent(this.failedLoginsByUser, user, windowSeconds);
    }

    getRecentRequestsByIp(ip, windowSeconds) {
        return this._getRecent(this.requestsByIp, ip, windowSeconds);
    }

    getRecentFailuresByIpUser(ip, user, windowSeconds) {
        const key = `${ip}:${user}`;
        return this._getRecent(this.recentFailuresByIpUser, key, windowSeconds);
    }

    /**
     * Periodic GC: purge all map entries older than 10 minutes across every bucket.
     * Prevents memory leaks under sustained attack traffic.
     */
    _runGC() {
        const maxAgeSec = 600; // 10 minute max retention
        const cutoffTime = Date.now() - maxAgeSec * 1000;
        let purgedKeys = 0;

        const pruneMap = (map) => {
            for (const [key, events] of map.entries()) {
                const recent = events.filter(e => new Date(e.timestamp).getTime() >= cutoffTime);
                if (recent.length === 0) {
                    map.delete(key);
                    purgedKeys++;
                } else {
                    map.set(key, recent);
                }
            }
        };

        pruneMap(this.failedLoginsByIp);
        pruneMap(this.failedLoginsByUser);
        pruneMap(this.requestsByIp);
        pruneMap(this.recentFailuresByIpUser);

        if (purgedKeys > 0) {
            logger.debug(`[STATE][GC] Purged ${purgedKeys} stale state keys`);
        }
    }
}

module.exports = new StateService();
