/**
 * @fileoverview Material Design 3 CSS ripple effect for buttons.
 * Attaches on DOMContentLoaded to all .btn and .icon-btn elements.
 * @module ripple
 */

/**
 * Create and play a ripple effect on a target element.
 * @param {HTMLElement} el - The button element.
 * @param {MouseEvent|PointerEvent} e - The triggering event.
 */
function triggerRipple(el, e) {
  const existing = el.querySelector('.ripple');
  if (existing) existing.remove();

  const rect   = el.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 1.5;
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  ripple.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
  `;

  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

/**
 * Attach ripple listener to a single element.
 * @param {HTMLElement} el
 */
function attachRipple(el) {
  if (el.dataset.rippleAttached) return;
  el.dataset.rippleAttached = '1';
  el.addEventListener('pointerdown', e => triggerRipple(el, e));
}

/**
 * Attach ripple to all current and future ripple-eligible elements.
 */
export function initRipples() {
  document.querySelectorAll('.btn, .icon-btn, .fab').forEach(attachRipple);

  /* MutationObserver for dynamically added buttons */
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('.btn, .icon-btn, .fab')) attachRipple(node);
        node.querySelectorAll?.('.btn, .icon-btn, .fab').forEach(attachRipple);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', initRipples);
