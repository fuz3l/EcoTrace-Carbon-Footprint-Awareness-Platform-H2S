/**
 * @fileoverview EcoTrace localStorage module — single access point.
 * All reads/writes go through here so corrupt data is handled centrally.
 * @module storage
 */

const KEYS = {
  HISTORY: 'ecotrace_history',
  TIPS_CACHE: 'ecotrace_tips_cache',
};

/**
 * Safely parse JSON from localStorage.
 * @param {string} key - The storage key.
 * @param {*} fallback - Value to return on error.
 * @returns {*}
 */
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Safely serialize and write JSON to localStorage.
 * @param {string} key - The storage key.
 * @param {*} value - Value to store.
 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/* ── History (array of footprint records) ──────────────────── */

/**
 * Retrieve all saved footprint records.
 * @returns {Array<{date: string, total: number, transport: number,
 *   energy: number, diet: number, shopping: number}>}
 */
export function getHistory() {
  return safeGet(KEYS.HISTORY, []);
}

/**
 * Append a new footprint record to history.
 * @param {{date: string, total: number, transport: number,
 *   energy: number, diet: number, shopping: number}} record
 */
export function saveRecord(record) {
  const history = getHistory();
  history.push({ ...record, id: Date.now() });
  safeSet(KEYS.HISTORY, history);
}

/**
 * Delete a record by its id.
 * @param {number} id - The record id.
 */
export function deleteRecord(id) {
  const history = getHistory().filter(r => r.id !== id);
  safeSet(KEYS.HISTORY, history);
}

/**
 * Clear all history records.
 */
export function clearHistory() {
  localStorage.removeItem(KEYS.HISTORY);
}

/* ── Tips cache ─────────────────────────────────────────────── */

const TIPS_TTL = 3_600_000; // 1 hour in ms

/**
 * Get cached AI tips if still valid.
 * @returns {Array|null} Array of tip objects, or null if expired/missing.
 */
export function getCachedTips() {
  const cache = safeGet(KEYS.TIPS_CACHE, null);
  if (!cache) return null;
  if (Date.now() - cache.timestamp > TIPS_TTL) return null;
  return cache.tips;
}

/**
 * Save AI tips to cache with a timestamp.
 * @param {Array} tips
 */
export function cacheTips(tips) {
  safeSet(KEYS.TIPS_CACHE, { tips, timestamp: Date.now() });
}

/**
 * Invalidate the tips cache.
 */
export function clearTipsCache() {
  localStorage.removeItem(KEYS.TIPS_CACHE);
}
