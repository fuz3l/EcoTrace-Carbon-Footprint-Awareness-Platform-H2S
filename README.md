# EcoTrace 🍃

**Track your impact. Shape your future.**

EcoTrace is a Carbon Footprint Awareness Platform that helps you measure, track, and reduce your personal carbon footprint — powered by Gemini AI and built with pure Material Design 3.

> Built for **Google PropTWars Hack 2 · Skill Challenge** · Powered by **Gemini AI**

---

## Screenshots

| Landing | Calculator | Dashboard | AI Tips |
|---------|-----------|-----------|---------|
| *(open index.html)* | *(open calculator.html)* | *(open dashboard.html)* | *(open tips.html)* |

---

## Features

- 🌍 **CO₂ Calculator** — Real-time gauge tracking transport, energy, diet & shopping emissions
- 📊 **Dashboard** — Line & doughnut charts with full history and delete support
- 🤖 **Gemini AI Tips** — 3 personalized, actionable reduction tips cached for 1 hour
- 🎨 **Material Design 3** — Full MD3 token system, typed components, tonal elevation
- ♿ **Accessible** — ARIA labels, keyboard nav, skip links, focus rings, ≥90 Lighthouse a11y

---

## Setup

No server, no build step, no dependencies to install.

1. Clone or download this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. Navigate between pages using the top app bar or bottom navigation (mobile)

That's it — no API key, no account, no internet required after the page loads.

---

## Run Tests

```bash
node tests/test-co2.js
```

All 10 tests should pass:

```
✓ car 100km = 21kg
✓ flight 100km = 25.5kg
✓ public 100km = 8.9kg
✓ electricity 100kwh = 23.3kg
✓ gas 100kwh = 20.3kg
✓ diet vegan = 19.8kg
✓ diet heavy_meat = 99kg
✓ shopping low = 10kg
✓ low footprint < 200
✓ high footprint > 400

10 passed, 0 failed
```

---

## Project Structure

```
ecotrace/
├── index.html          # Landing page
├── calculator.html     # CO2 Calculator with live gauge
├── dashboard.html      # Charts + history
├── tips.html           # Gemini AI tips
├── css/
│   ├── tokens.css      # MD3 color, type, shape, elevation tokens
│   ├── components.css  # Top bar, cards, buttons, inputs, chips, snackbar
│   └── pages.css       # Page-specific layout
├── js/
│   ├── config.js       # CO2 coefficients (single source of truth)
│   ├── storage.js      # localStorage module
│   ├── calculator.js   # Emission logic + gauge
│   ├── dashboard.js    # Chart.js + MD3 theme
│   ├── tips.js         # Gemini API + cache
│   └── ripple.js       # MD3 ripple effect
├── assets/
│   └── logo.svg        # Leaf-pin SVG logo
├── tests/
│   └── test-co2.js     # Unit tests (vanilla Node.js)
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 Semantic |
| Styling | Vanilla CSS3 (MD3 custom properties) |
| Logic | Vanilla JS ES6 Modules |
| Charts | Chart.js 4 via CDN |
| AI | Gemini 1.5 Flash API |
| Fonts | Plus Jakarta Sans + Roboto (Google Fonts) |
| Icons | Material Symbols Outlined (Google Fonts) |
| Storage | localStorage |
| Build tools | **None** |

---

## CO₂ Coefficients

| Activity | Factor |
|---------|--------|
| Car | 0.21 kg/km |
| Flight | 0.255 kg/km |
| Public transport | 0.089 kg/km |
| Electricity | 0.233 kg/kWh (India grid) |
| Natural gas | 0.203 kg/kWh |
| Vegan diet | 19.8 kg/month |
| Moderate meat | 59.4 kg/month |
| Heavy meat | 99.0 kg/month |
| Low shopping | 10.0 kg/month |
| Medium shopping | 25.0 kg/month |
| High shopping | 45.0 kg/month |

---

## Accessibility

- `<html lang="en">` on every page
- Skip navigation link on every page
- All inputs have explicit `<label for>` associations
- Live gauge has `aria-live` + `aria-label` updated by JS
- Charts have descriptive `aria-label` on `<canvas>`
- All interactive elements reachable via keyboard
- Focus ring: 2px solid primary, 2px offset
- Badges include text label (never color-only)
- Respects `prefers-reduced-motion`

---

## License

MIT — Built for Google PropTWars Hack 2 · Powered by Gemini AI
