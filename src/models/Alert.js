class Alert {
    /**
     * @param {string} id 
     * @param {string} type 
     * @param {string} severity // "LOW" | "MEDIUM" | "HIGH"
     * @param {string} ip 
     * @param {string} user 
     * @param {string} message 
     * @param {Record<string, unknown>} evidence 
     * @param {string} dedupeKey 
     */
    constructor({ id, type, severity, ip, user, message, evidence, dedupeKey }) {
        this.id = id;
        this.type = type;
        this.severity = severity;
        this.ip = ip;
        this.user = user;
        this.message = message;
        this.evidence = evidence;
        this.createdAt = new Date().toISOString();
        this.dedupeKey = dedupeKey;
    }
}

module.exports = Alert;
