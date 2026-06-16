/**
 * @fileoverview Calculator page logic: emission calculations, live gauge,
 * real-time breakdown bars, and save-to-history.
 * @module calculator
 */

import { CO2, INPUT_LIMITS, CATEGORY_ICONS } from './config.js';
import { saveRecord } from './storage.js';

/* ── Snackbar ─────────────────────────────────────────────── */
/**
 * Show a snackbar notification.
 * @param {string} message
 * @param {string} [actionLabel]
 * @param {Function} [onAction]
 */
function showSnackbar(message, actionLabel = '', onAction = null) {
  const sb = document.getElementById('snackbar');
  if (!sb) return;
  sb.querySelector('.snackbar__msg').textContent = message;
  const btn = sb.querySelector('.snackbar__action');
  if (actionLabel && btn) {
    btn.textContent = actionLabel;
    btn.style.display = '';
    btn.onclick = onAction;
  } else if (btn) {
    btn.style.display = 'none';
  }
  sb.classList.add('visible');
  clearTimeout(sb._timer);
  sb._timer = setTimeout(() => sb.classList.remove('visible'), 3000);
}

/* ── Emission calculation functions ───────────────────────── */

/**
 * Calculate monthly CO2 from transport inputs.
 * @param {number} carKm - Car km/month
 * @param {number} flightKm - Flight km/month
 * @param {number} publicKm - Public transport km/month
 * @returns {number} kg CO2/month
 */
export function calculateTransportEmissions(carKm, flightKm, publicKm) {
  return (
    carKm    * CO2.TRANSPORT.CAR_PER_KM +
    flightKm * CO2.TRANSPORT.FLIGHT_PER_KM +
    publicKm * CO2.TRANSPORT.PUBLIC_PER_KM
  );
}

/**
 * Calculate monthly CO2 from energy inputs.
 * @param {number} electricityKwh
 * @param {number} gasKwh
 * @returns {number} kg CO2/month
 */
export function calculateEnergyEmissions(electricityKwh, gasKwh) {
  return (
    electricityKwh * CO2.ENERGY.ELECTRICITY_PER_KWH +
    gasKwh         * CO2.ENERGY.GAS_PER_KWH
  );
}

/**
 * Return diet CO2 for a given diet key.
 * @param {'VEGAN'|'MODERATE_MEAT'|'HEAVY_MEAT'} key
 * @returns {number}
 */
export function dietEmission(key) {
  return CO2.DIET[key] ?? 0;
}

/**
 * Return shopping CO2 for a given level key.
 * @param {'LOW'|'MEDIUM'|'HIGH'} key
 * @returns {number}
 */
export function shoppingEmission(key) {
  return CO2.SHOPPING[key] ?? 0;
}

/**
 * Determine emission level label.
 * @param {number} total - kg CO2/month
 * @returns {'low'|'medium'|'high'}
 */
export function getEmissionLevel(total) {
  if (total < CO2.THRESHOLDS.LOW_MAX)  return 'low';
  if (total >= CO2.THRESHOLDS.HIGH_MIN) return 'high';
  return 'medium';
}

/* ── DOM refs ─────────────────────────────────────────────── */
const elCarKm    = () => document.getElementById('car-km');
const elFlightKm = () => document.getElementById('flight-km');
const elPublicKm = () => document.getElementById('public-km');
const elElec     = () => document.getElementById('electricity');
const elGas      = () => document.getElementById('gas');

const elGaugeFill  = () => document.getElementById('gauge-fill');
const elGaugeTotal = () => document.getElementById('gauge-total');
const elGaugeBadge = () => document.getElementById('gauge-badge');
const elGaugeEl    = () => document.getElementById('gauge-bar');

/* ── Animated counter ────────────────────────────────────── */
let _counterTarget = 0, _counterFrame = null, _counterCurrent = 0;
/**
 * Animate the displayed number up/down to target.
 * @param {number} target
 */
function animateCounter(target) {
  _counterTarget = target;
  if (_counterFrame) cancelAnimationFrame(_counterFrame);
  const step = () => {
    const diff = _counterTarget - _counterCurrent;
    if (Math.abs(diff) < 0.5) {
      _counterCurrent = _counterTarget;
    } else {
      _counterCurrent += diff * 0.12;
    }
    const el = elGaugeTotal();
    if (el) el.textContent = Math.round(_counterCurrent).toLocaleString();
    if (Math.round(_counterCurrent) !== Math.round(_counterTarget)) {
      _counterFrame = requestAnimationFrame(step);
    }
  };
  _counterFrame = requestAnimationFrame(step);
}

/* ── Gauge update ─────────────────────────────────────────── */
/**
 * Update the gauge UI with new emission totals.
 * @param {{transport:number, energy:number, diet:number, shopping:number}} cats
 */
function updateGauge(cats) {
  const total = Object.values(cats).reduce((a, b) => a + b, 0);
  const pct   = Math.min(total / CO2.THRESHOLDS.HIGH_MIN * 80, 100); // 80% at HIGH_MIN
  const level = getEmissionLevel(total);

  animateCounter(total);

  const fill = elGaugeFill();
  if (fill) fill.style.height = pct + '%';

  const gauge = elGaugeEl();
  if (gauge) {
    gauge.setAttribute('aria-label',
      `CO2 gauge showing ${Math.round(total)} kg per month, level: ${level}`);
  }

  const badge = elGaugeBadge();
  if (badge) {
    badge.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    badge.className = `badge badge--${level}`;
  }

  /* Update category bars */
  const catNames = ['transport','energy','diet','shopping'];
  catNames.forEach(cat => {
    const bar  = document.querySelector(`[data-bar="${cat}"] .progress-bar__fill`);
    const lbl  = document.querySelector(`[data-bar="${cat}"] .kg`);
    const val  = cats[cat];
    if (bar) bar.style.width = total > 0 ? Math.min(val / total * 100, 100) + '%' : '0%';
    if (lbl) lbl.textContent = val.toFixed(1) + ' kg';
  });
}

/* ── Slider ↔ input sync ──────────────────────────────────── */
/**
 * Wire a numeric input to a range slider for bi-directional sync.
 * @param {string} inputId
 * @param {string} sliderId
 * @param {string} valId - span showing current value
 * @param {{min:number, max:number}} limits
 */
function syncSlider(inputId, sliderId, valId, limits) {
  const inp = document.getElementById(inputId);
  const sld = document.getElementById(sliderId);
  const val = document.getElementById(valId);
  if (!inp || !sld) return;

  const clamp = v => Math.max(limits.min, Math.min(limits.max, v));

  const update = v => {
    const clamped = clamp(v);
    inp.value = clamped;
    sld.value = clamped;
    if (val) val.textContent = clamped;
    recalculate();
  };

  inp.addEventListener('input', () => update(parseFloat(inp.value) || 0));
  sld.addEventListener('input', () => update(parseFloat(sld.value) || 0));
  update(parseFloat(inp.value) || 0);
}

/* ── Chip selection ───────────────────────────────────────── */
/**
 * Make a chip group single-select.
 * @param {string} groupId
 * @param {Function} onChange - called with the selected value
 */
function initChipGroup(groupId, onChange) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('selected');
      chip.setAttribute('aria-pressed', 'true');
      onChange(chip.dataset.value);
      recalculate();
    });
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
    });
  });
}

/* ── State ───────────────────────────────────────────────── */
let _diet     = 'MODERATE_MEAT';
let _shopping = 'MEDIUM';

/* ── Recalculate ─────────────────────────────────────────── */
function recalculate() {
  const carKm    = parseFloat(document.getElementById('car-km')?.value)    || 0;
  const flightKm = parseFloat(document.getElementById('flight-km')?.value) || 0;
  const publicKm = parseFloat(document.getElementById('public-km')?.value) || 0;
  const elec     = parseFloat(document.getElementById('electricity')?.value)|| 0;
  const gas      = parseFloat(document.getElementById('gas')?.value)        || 0;

  const cats = {
    transport: calculateTransportEmissions(carKm, flightKm, publicKm),
    energy:    calculateEnergyEmissions(elec, gas),
    diet:      dietEmission(_diet),
    shopping:  shoppingEmission(_shopping),
  };
  updateGauge(cats);
  return cats;
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Sliders */
  syncSlider('car-km',      'car-km-slider',      'car-km-val',    INPUT_LIMITS.CAR_KM);
  syncSlider('flight-km',   'flight-km-slider',   'flight-km-val', INPUT_LIMITS.FLIGHT_KM);
  syncSlider('public-km',   'public-km-slider',   'public-km-val', INPUT_LIMITS.PUBLIC_KM);
  syncSlider('electricity', 'electricity-slider', 'elec-val',      INPUT_LIMITS.ELECTRICITY);
  syncSlider('gas',         'gas-slider',          'gas-val',       INPUT_LIMITS.GAS);

  /* Chips */
  initChipGroup('diet-chips', v => { _diet = v; });
  initChipGroup('shopping-chips', v => { _shopping = v; });

  /* Initial compute */
  recalculate();

  /* Save button */
  document.getElementById('save-btn')?.addEventListener('click', () => {
    const cats = recalculate();
    const record = {
      date: new Date().toISOString().slice(0, 10),
      total: Object.values(cats).reduce((a,b) => a+b, 0),
      ...cats,
    };
    saveRecord(record);
    showSnackbar('Footprint saved! ✓', 'View Dashboard', () => {
      window.location.href = 'dashboard.html';
    });
  });

  /* Top app bar elevation on scroll */
  const bar = document.querySelector('.top-app-bar');
  window.addEventListener('scroll', () => {
    bar?.classList.toggle('elevated', window.scrollY > 4);
  }, { passive: true });
});
