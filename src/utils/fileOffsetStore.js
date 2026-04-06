/**
 * File Offset Store
 * 
 * Tracks how many bytes of each log file have already been read.
 * This prevents duplicate processing — each read starts after
 * the last known offset.
 * 
 * Storage: In-memory (resets on restart).
 * Future: Could be persisted to disk or Redis.
 * 
 * Internal structure example:
 * {
 *   "app.log": 1245   // 1245 bytes already read
 * }
 */

const offsets = {};

/**
 * Get the current byte offset for a given file
 * @param {string} filename - The filename (e.g. "app.log")
 * @returns {number} The byte offset (0 if never read)
 */
const getOffset = (filename) => {
    return offsets[filename] || 0;
};

/**
 * Set/update the byte offset for a given file
 * @param {string} filename - The filename
 * @param {number} offset   - New byte offset
 */
const setOffset = (filename, offset) => {
    offsets[filename] = offset;
};

/**
 * Get all tracked offsets
 * @returns {Object} Map of filename -> offset
 */
const getAllOffsets = () => {
    return { ...offsets };
};

module.exports = {
    getOffset,
    setOffset,
    getAllOffsets,
};
