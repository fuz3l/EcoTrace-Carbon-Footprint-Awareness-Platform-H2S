/**
 * @fileoverview Unit tests for storage logic.
 * Run with: node tests/test-storage.js
 */

const mockStorage = {};
const localStorage = {
  getItem: key => mockStorage[key] ?? null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: key => { delete mockStorage[key]; }
};

/* ── Logic to test (from storage.js) ─────────────────────── */
const KEYS = { HISTORY: 'ecotrace_history' };

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function getHistory() {
  return safeGet(KEYS.HISTORY, []);
}

function saveRecord(record) {
  const history = getHistory();
  history.push({ ...record, id: 12345 }); // mock ID
  safeSet(KEYS.HISTORY, history);
}

function deleteRecord(id) {
  const history = getHistory().filter(r => r.id !== id);
  safeSet(KEYS.HISTORY, history);
}

function clearHistory() {
  localStorage.removeItem(KEYS.HISTORY);
}

/* ── Test runner ─────────────────────────────────────────── */
let p = 0, f = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log('✓', name);
    p++;
  } catch (e) {
    console.error('✗', name, '-', e.message);
    f++;
  }
};
const assert = (a, e) => {
  if (JSON.stringify(a) !== JSON.stringify(e))
    throw new Error(`Expected ${JSON.stringify(e)}, got ${JSON.stringify(a)}`);
};

/* ── Test cases ──────────────────────────────────────────── */
test('safeGet returns fallback when empty', () => {
  clearHistory();
  assert(safeGet('foo', 'bar'), 'bar');
});

test('safeGet returns parsed JSON', () => {
  localStorage.setItem('foo', '{"a":1}');
  assert(safeGet('foo', {}), {a: 1});
});

test('safeGet handles invalid JSON', () => {
  localStorage.setItem('foo', 'invalid{json');
  assert(safeGet('foo', []), []);
});

test('getHistory returns empty array initially', () => {
  clearHistory();
  assert(getHistory(), []);
});

test('saveRecord appends to history', () => {
  clearHistory();
  saveRecord({ total: 100 });
  const h = getHistory();
  assert(h.length, 1);
  assert(h[0].total, 100);
});

test('deleteRecord removes specific record', () => {
  clearHistory();
  saveRecord({ total: 100 });
  saveRecord({ total: 200 }); // Both get ID 12345 in this mock, so let's adjust it manually
  let h = getHistory();
  h[0].id = 1;
  h[1].id = 2;
  safeSet(KEYS.HISTORY, h);
  
  deleteRecord(1);
  h = getHistory();
  assert(h.length, 1);
  assert(h[0].id, 2);
});

/* ── Summary ─────────────────────────────────────────────── */
console.log(`\n${p} passed, ${f} failed`);
if (f > 0) process.exit(1);
