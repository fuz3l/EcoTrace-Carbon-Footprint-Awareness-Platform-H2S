/**
 * @fileoverview Dashboard page — Chart.js integration with MD3 theme,
 * stats cards, history table with delete, and empty state.
 * @module dashboard
 */
"use strict";

import { getHistory, deleteRecord } from './storage.js';
import { CO2 } from './config.js';

/* ── MD3-themed Chart.js defaults ────────────────────────── */
const MD3_COLORS = {
  primary:   '#146C3C',
  pContainer:'#B7F1C8',
  secondary: '#4E6356',
  tertiary:  '#3B6470',
  error:     '#BA1A1A',
  surface:   '#F8FAF7',
  outline:   '#C0C9C0',
};

/** Chart.js colors for pie slices */
const PIE_COLORS = [
  MD3_COLORS.primary,
  '#3B6470',
  '#E9C46A',
  '#E76F51',
];

/* ── Utilities ───────────────────────────────────────────── */
/**
 * Format kg value for display.
 * @param {number} n
 * @returns {string}
 */
function fmt(n) { return n.toFixed(1); }

/**
 * Format delta for display.
 * @param {number} diff - difference vs previous
 * @returns {{text: string, cls: string}}
 */
function fmtDelta(diff) {
  if (!isFinite(diff)) return { text: '—', cls: 'delta--neutral' };
  const sign = diff > 0 ? '↑' : '↓';
  const cls  = diff > 0 ? 'delta--up' : 'delta--down';
  return { text: `${sign} ${Math.abs(diff).toFixed(1)} kg`, cls };
}

/* ── Render functions ────────────────────────────────────── */
/**
 * Render the three summary stat cards.
 * @param {Array} history
 */
function renderStats(history) {
  const latest = history.at(-1);
  const prev   = history.at(-2);

  const thisMonth = document.getElementById('stat-this-month');
  const vsLast    = document.getElementById('stat-vs-last');
  const vsIndia   = document.getElementById('stat-vs-india');

  if (!latest) return;

  if (thisMonth) thisMonth.textContent = fmt(latest.total) + ' kg';

  if (vsLast) {
    if (prev) {
      const { text, cls } = fmtDelta(latest.total - prev.total);
      vsLast.textContent = text;
      vsLast.className = `delta ${cls}`;
    } else {
      vsLast.textContent = 'First entry';
      vsLast.className = 'delta delta--neutral';
    }
  }

  if (vsIndia) {
    const diff = latest.total - CO2.THRESHOLDS.INDIA_AVG;
    const { text, cls } = fmtDelta(diff);
    vsIndia.textContent = text + ' vs India avg';
    vsIndia.className = `delta ${cls}`;
  }
}

/** @type {Chart|null} */
let lineChart = null;
/**
 * Render the line chart for historical footprint.
 * @param {Array} history
 */
function renderLineChart(history) {
  const canvas = document.getElementById('line-chart');
  if (!canvas) return;
  if (lineChart) lineChart.destroy();

  const labels = history.map(r => r.date);
  const data   = history.map(r => r.total);

  lineChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total CO2 (kg)',
        data,
        borderColor: MD3_COLORS.primary,
        backgroundColor: MD3_COLORS.pContainer + '55',
        borderWidth: 2.5,
        pointBackgroundColor: MD3_COLORS.pContainer,
        pointBorderColor: MD3_COLORS.primary,
        pointRadius: 5,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y.toFixed(1)} kg CO₂`,
          },
        },
      },
      scales: {
        x: { grid: { color: MD3_COLORS.outline }, ticks: { color: '#404943' } },
        y: {
          grid: { color: MD3_COLORS.outline },
          ticks: { color: '#404943', callback: v => v + ' kg' },
          beginAtZero: true,
        },
      },
    },
  });
}

/** @type {Chart|null} */
let pieChart = null;
/**
 * Render pie chart with latest record breakdown.
 * @param {Array} history
 */
function renderPieChart(history) {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;
  if (pieChart) pieChart.destroy();

  const latest = history.at(-1);
  if (!latest) return;

  pieChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Transport', 'Energy', 'Diet', 'Shopping'],
      datasets: [{
        data: [latest.transport, latest.energy, latest.diet, latest.shopping],
        backgroundColor: PIE_COLORS,
        borderWidth: 2,
        borderColor: MD3_COLORS.surface,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#191C1A', font: { family: 'Roboto', size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(1)} kg`,
          },
        },
      },
      cutout: '65%',
    },
  });
}

/**
 * Render the history table, with delete buttons.
 * @param {Array} history
 */
function renderTable(history) {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  if (history.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--md-on-surface-variant)">
        No records yet.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = [...history].reverse().map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${fmt(r.total)}</td>
      <td>${fmt(r.transport)}</td>
      <td>${fmt(r.energy)}</td>
      <td>${fmt(r.diet)}</td>
      <td>
        <button class="icon-btn danger" data-delete="${r.id}"
          aria-label="Delete record from ${r.date}">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');

  /* Delegate delete clicks */
  tbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    deleteRecord(Number(btn.dataset.delete));
    renderAll();
  });
}

/**
 * Show or hide the empty state section.
 * @param {Array} history
 */
function toggleEmptyState(history) {
  const empty   = document.getElementById('empty-state');
  const content = document.getElementById('dashboard-content');
  if (!empty || !content) return;
  if (history.length === 0) {
    empty.hidden   = false;
    content.hidden = true;
  } else {
    empty.hidden   = true;
    content.hidden = false;
  }
}

/** Full render cycle. */
function renderAll() {
  const history = getHistory();
  toggleEmptyState(history);
  if (history.length > 0) {
    renderStats(history);
    renderLineChart(history);
    renderPieChart(history);
    renderTable(history);
  }
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();

  const bar = document.querySelector('.top-app-bar');
  window.addEventListener('scroll', () => {
    bar?.classList.toggle('elevated', window.scrollY > 4);
  }, { passive: true });
});
