/**
 * @fileoverview Rule-based eco tips engine.
 * Selects personalized tips from a curated local bank based on the user's
 * highest emission categories. No API key or network request required.
 * @module tips
 */

import { getHistory } from './storage.js';
import { CO2 } from './config.js';

/* ── Tip bank ────────────────────────────────────────────── */
/**
 * Curated tips per category. Each tip has a `tip` string and
 * an `impact` level ("low" | "medium" | "high").
 * @type {Record<string, Array<{tip: string, impact: string}>>}
 */
const TIP_BANK = {
  transport: [
    { tip: 'Switch one car trip per week to cycling or walking — cycling produces zero emissions and improves cardiovascular health.', impact: 'medium' },
    { tip: 'Combine errands into a single trip. Trip-chaining can cut your driving distance by up to 30%.', impact: 'medium' },
    { tip: 'Consider carpooling for your regular commute. Sharing a ride halves your per-person transport emissions.', impact: 'high' },
    { tip: 'Take public transport for journeys under 20 km — buses and trains emit up to 60% less CO₂ per passenger-km than a solo car trip.', impact: 'high' },
    { tip: 'If you must fly, choose direct flights. Take-off and landing account for the majority of a flight\'s fuel burn.', impact: 'medium' },
    { tip: 'Switch to an electric or hybrid vehicle for your next car purchase — EVs produce 3× fewer lifetime emissions than petrol cars in India.', impact: 'high' },
    { tip: 'Keep your car tires properly inflated. Under-inflated tires increase fuel consumption by up to 3%.', impact: 'low' },
  ],
  energy: [
    { tip: 'Replace your 5 most-used light bulbs with LEDs — they use 75% less electricity and last 25× longer.', impact: 'medium' },
    { tip: 'Set your air conditioner to 24°C instead of 18°C. Each degree cooler increases electricity use by ~6%.', impact: 'high' },
    { tip: 'Unplug chargers and electronics when not in use. Standby power ("vampire draw") can account for 10% of a home\'s electricity bill.', impact: 'low' },
    { tip: 'Wash clothes in cold water. Heating water accounts for ~90% of the energy used by a washing machine.', impact: 'medium' },
    { tip: 'Install a ceiling fan — it can make a room feel 3–4°C cooler, reducing AC usage significantly.', impact: 'medium' },
    { tip: 'Consider rooftop solar. A 2 kW system in India can offset 2,400 kg of CO₂ annually and typically pays back in 5–6 years.', impact: 'high' },
    { tip: 'Use a pressure cooker — it cuts cooking energy consumption by up to 70% compared to a regular pot.', impact: 'low' },
  ],
  diet: [
    { tip: 'Try "Meatless Monday" — cutting meat just one day a week saves roughly 900 kg of CO₂ per year.', impact: 'medium' },
    { tip: 'Choose locally grown and seasonal produce. Imported food can have 50× higher transport emissions than local alternatives.', impact: 'medium' },
    { tip: 'Reduce food waste — about one-third of all food produced globally is wasted, generating 8% of greenhouse gas emissions.', impact: 'high' },
    { tip: 'Replace one beef meal per week with chicken, fish, or legumes. Beef produces 20× more emissions per kg than chicken.', impact: 'high' },
    { tip: 'Compost kitchen scraps instead of sending them to landfill, where they release methane (a greenhouse gas 25× more potent than CO₂).', impact: 'medium' },
    { tip: 'Buy in bulk to reduce packaging waste. Manufacturing packaging can account for up to 10% of a product\'s total carbon footprint.', impact: 'low' },
  ],
  shopping: [
    { tip: 'Before buying new, check second-hand platforms. Buying used clothing generates 70% less CO₂ than buying new.', impact: 'high' },
    { tip: 'Choose products with minimal or recyclable packaging — packaging waste contributes significantly to landfill methane emissions.', impact: 'low' },
    { tip: 'Buy durable, repairable items over cheap disposables. Fast fashion and electronics are among the highest-emission product categories.', impact: 'high' },
    { tip: 'Consolidate online orders to reduce delivery trips. Choosing slower "standard" shipping often uses more efficient bulk logistics.', impact: 'medium' },
    { tip: 'Bring a reusable bag every time you shop. Producing a single plastic bag emits ~1.6 kg of CO₂ equivalent.', impact: 'low' },
    { tip: 'Repair electronics instead of replacing them. Manufacturing a new smartphone emits ~70 kg of CO₂ — 80% of its lifetime footprint.', impact: 'high' },
  ],
};

/* ── Tip selection engine ────────────────────────────────── */
/**
 * Rank categories by emission value (descending).
 * @param {{transport:number, energy:number, diet:number, shopping:number}} cats
 * @returns {string[]} category names, highest first
 */
function rankCategories(cats) {
  return Object.entries(cats)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
}

/**
 * Pick one tip per category, prioritising the top-emission categories.
 * Returns exactly 3 tips.
 * @param {string[]} rankedCats - categories sorted by emission, highest first
 * @returns {Array<{category: string, tip: string, impact: string}>}
 */
function pickTips(rankedCats) {
  const selected = [];
  const usedCategories = new Set();

  /* First pass: one tip from each of the top 3 categories */
  for (const cat of rankedCats) {
    if (selected.length >= 3) break;
    if (usedCategories.has(cat)) continue;
    const bank = TIP_BANK[cat];
    if (!bank?.length) continue;

    /* Pick a random tip from this category */
    const tip = bank[Math.floor(Math.random() * bank.length)];
    selected.push({ category: cat.charAt(0).toUpperCase() + cat.slice(1), ...tip });
    usedCategories.add(cat);
  }

  /* Fallback: fill remaining slots if fewer than 3 categories */
  if (selected.length < 3) {
    for (const cat of Object.keys(TIP_BANK)) {
      if (selected.length >= 3) break;
      if (usedCategories.has(cat)) continue;
      const bank = TIP_BANK[cat];
      const tip = bank[Math.floor(Math.random() * bank.length)];
      selected.push({ category: cat.charAt(0).toUpperCase() + cat.slice(1), ...tip });
      usedCategories.add(cat);
    }
  }

  return selected;
}

/**
 * Generate personalized tips from local history data.
 * Falls back to balanced defaults if no history exists.
 * @returns {Array<{category: string, tip: string, impact: string}>}
 */
function generateTips() {
  const history = getHistory();
  const latest  = history.at(-1);

  const cats = latest
    ? { transport: latest.transport, energy: latest.energy, diet: latest.diet, shopping: latest.shopping }
    : { transport: 1, energy: 1, diet: 1, shopping: 1 }; /* equal weight → balanced tips */

  return pickTips(rankCategories(cats));
}

/* ── Render helpers ──────────────────────────────────────── */
const ICONS = {
  transport: 'directions_car',
  energy:    'bolt',
  diet:      'restaurant',
  shopping:  'shopping_bag',
};

/**
 * Resolve a Material Symbol icon for a category name.
 * @param {string} category
 * @returns {string}
 */
function iconFor(category) {
  return ICONS[category.toLowerCase()] ?? 'eco';
}

/**
 * Escape text for safe DOM insertion.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

/**
 * Show skeleton loading cards (brief, just for perceived polish).
 */
function showSkeletons() {
  const container = document.getElementById('tips-container');
  if (!container) return;
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = Array.from({ length: 3 }, () => `
    <div class="card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-icon"></div>
      <div class="skeleton skeleton-line skeleton-line--lg"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line--sm"></div>
    </div>
  `).join('');
}

/**
 * Render tip cards.
 * @param {Array<{category: string, tip: string, impact: string}>} tips
 */
function renderTips(tips) {
  const container = document.getElementById('tips-container');
  if (!container) return;
  container.setAttribute('aria-busy', 'false');
  container.innerHTML = tips.map(t => `
    <article class="card tip-card">
      <div class="tip-card__top">
        <div class="tip-icon" aria-hidden="true">
          <span class="material-symbols-outlined">${iconFor(t.category)}</span>
        </div>
        <h3 class="tip-card__title title-medium">${sanitize(t.category)}</h3>
      </div>
      <p class="tip-card__body body-large">${sanitize(t.tip)}</p>
      <div class="tip-card__footer">
        <span class="badge badge--${sanitize(t.impact)}">
          <span class="material-symbols-outlined" style="font-size:14px">
            ${t.impact === 'high' ? 'priority_high' : t.impact === 'medium' ? 'trending_up' : 'check_circle'}
          </span>
          ${sanitize(t.impact)} impact
        </span>
      </div>
    </article>
  `).join('');
}

/* ── Main loader ─────────────────────────────────────────── */
/**
 * Load and display tips (instant — no network call).
 */
function loadTips() {
  showSkeletons();
  /* Tiny delay so the skeleton is visible — feels more alive */
  setTimeout(() => renderTips(generateTips()), 400);
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadTips();

  /* Refresh shuffles new tips from the bank */
  document.getElementById('refresh-btn')?.addEventListener('click', loadTips);

  const bar = document.querySelector('.top-app-bar');
  window.addEventListener('scroll', () => {
    bar?.classList.toggle('elevated', window.scrollY > 4);
  }, { passive: true });
});
