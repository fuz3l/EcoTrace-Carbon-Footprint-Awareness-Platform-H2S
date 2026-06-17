/**
 * @fileoverview Unit tests for tips logic.
 * Run with: node tests/test-tips.js
 */

/* ── Logic to test (from tips.js) ─────────────────────── */
function rankCategories(cats) {
  return Object.entries(cats)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
}

const TIP_BANK = {
  transport: [{ tip: 'T1', impact: 'high' }, { tip: 'T2', impact: 'low' }],
  energy: [{ tip: 'E1', impact: 'high' }],
  diet: [{ tip: 'D1', impact: 'medium' }],
  shopping: [{ tip: 'S1', impact: 'low' }]
};

function pickTips(rankedCats) {
  const selected = [];
  const usedCategories = new Set();

  for (const cat of rankedCats) {
    if (selected.length >= 3) break;
    if (usedCategories.has(cat)) continue;
    const bank = TIP_BANK[cat];
    if (!bank?.length) continue;

    const tip = bank[0]; // Simplified random pick for deterministic test
    selected.push({ category: cat, ...tip });
    usedCategories.add(cat);
  }

  if (selected.length < 3) {
    for (const cat of Object.keys(TIP_BANK)) {
      if (selected.length >= 3) break;
      if (usedCategories.has(cat)) continue;
      const bank = TIP_BANK[cat];
      const tip = bank[0];
      selected.push({ category: cat, ...tip });
      usedCategories.add(cat);
    }
  }

  return selected;
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
test('rankCategories sorts correctly', () => {
  const cats = { transport: 10, energy: 50, diet: 30, shopping: 20 };
  const ranked = rankCategories(cats);
  assert(ranked, ['energy', 'diet', 'shopping', 'transport']);
});

test('rankCategories handles ties', () => {
  // Object.entries iteration order isn't guaranteed for ties, but generally stable based on insert order
  const cats = { a: 10, b: 10 };
  const ranked = rankCategories(cats);
  assert(ranked.length, 2);
  assert(ranked.includes('a'), true);
  assert(ranked.includes('b'), true);
});

test('pickTips selects exactly 3 tips', () => {
  const ranked = ['diet', 'transport', 'shopping', 'energy'];
  const tips = pickTips(ranked);
  assert(tips.length, 3);
  assert(tips[0].category, 'diet');
  assert(tips[1].category, 'transport');
  assert(tips[2].category, 'shopping');
});

test('pickTips fallbacks if less than 3 categories provided', () => {
  const tips = pickTips(['diet']); // only 1 category
  assert(tips.length, 3);
  assert(tips[0].category, 'diet');
  assert(tips[1].category, 'transport'); // fills with other categories
  assert(tips[2].category, 'energy');
});

/* ── Summary ─────────────────────────────────────────────── */
console.log(`\n${p} passed, ${f} failed`);
if (f > 0) process.exit(1);
