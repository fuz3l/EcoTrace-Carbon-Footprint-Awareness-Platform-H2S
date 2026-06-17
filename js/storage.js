/**
 * @fileoverview EcoTrace localStorage module — single access point.
 * All reads/writes go through here so corrupt data is handled centrally.
 * @module storage
 */
"use strict";

const KEYS = {
  HISTORY: 'ecotrace_history',
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

