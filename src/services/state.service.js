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
    }

    /**
     * @param {any} event 
     */
    addEvent(event) {
        if (!event || !event.timestamp) return;

        const isFailedLogin = event.type === 'FAILED_LOGIN';
        const isRequest = event.type === 'REQUEST';
        const isSuccessLogin = event.type === 'LOGIN_SUCCESS';

        if (isFailedLogin) {
            if (event.ip) this._addToList(this.failedLoginsByIp, event.ip, event);
            if (event.user) this._addToList(this.failedLoginsByUser, event.user, event);
            if (event.ip && event.user) {
                const key = `${event.ip}:${event.user}`;
                this._addToList(this.recentFailuresByIpUser, key, event);
            }
        } else if (isRequest) {
            if (event.ip) this._addToList(this.requestsByIp, event.ip, event);
        } else if (isSuccessLogin) {
            // Need recent failures to check for Possible Compromise
            if (event.ip && event.user) {
                const key = `${event.ip}:${event.user}`;
                // Keep the success event to help rules evaluate, but failures are separately tracked.
                // Actually, the rule can just be called giving the current success event, and it reads this.getRecentFailuresByIpUser
            }
        }
    }

    _addToList(map, key, event) {
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(event);
    }

    /**
     * Gets events in the last N seconds
     */
    _getRecent(map, key, windowSeconds) {
        const events = map.get(key) || [];
        const cutoffTime = Date.now() - (windowSeconds * 1000);
        
        // Filter out old events to keep memory clean
        const recentEvents = events.filter(e => new Date(e.timestamp).getTime() >= cutoffTime);
        map.set(key, recentEvents); // Clean up in place
        
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
}

module.exports = new StateService();
