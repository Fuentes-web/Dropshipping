# Manifest Supply Co. — Dropshipping Storefront

A production-grade, fully responsive e-commerce landing page for a dropshipping
brand. Static HTML/CSS/JS — no build step, no framework, no dependencies beyond
web fonts.

## Run it

```bash
cd dropship-site
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` in a browser.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Full page markup — 12-product catalog, logistics, spotlight, reviews, FAQ, footer, cart drawer |
| `styles.css` | Design system + all layout, type, colour and motion |
| `app.js` | Cart state, category filters, accordion, scroll reveals, forms, order tracker |
| `shots/` | Rendered screenshots used during design QA |

## Design direction

**Editorial print × logistics manifest.** The concept: a dropshipping brand whose
whole promise is *shipping speed*, so the visual language borrows from waybills,
customs stamps and dispatch labels — then dresses it in warm editorial print.

- **Palette** — warm paper `#F2EDE4`, deep ink `#191512`, vermilion accent `#DC3F1B`,
  moss green `#2E4739` for support. Every neutral is tinted toward the paper hue;
  no pure black or white anywhere.
- **Type** — Fraunces (variable optical serif, `opsz`/`SOFT`/`WONK` axes) for display,
  Archivo for UI, IBM Plex Mono for shipping data and micro-labels.
- **Texture** — an SVG `feTurbulence` grain layer over the whole page for paper feel.
- **Product art** — all six original product illustrations are hand-built inline SVG,
  so nothing depends on external image hosts.

## What works

- **Cart drawer** — add to cart from any card or the spotlight, quantity +/−, remove,
  live subtotal, free shipping over $75, running total, badge count with bump animation.
- **Category filter** — 7 chips over 6 categories (2 products each) with a live
  result count and a staggered re-entry animation.
- **Order tracker** — validates waybill format; `MSC-4417-0928-QX` returns the demo result.
- **FAQ accordion** — native `<details>`, single-open behaviour.
- **Newsletter** — inline email validation with success / error states, no modal.
- **Scroll reveals** — `IntersectionObserver` with per-element stagger.
- **Sticky nav** — gains a hairline border and solidifies past 12px of scroll.

## Accessibility

- Skip link, visible focus rings, labelled controls, `aria-selected` on filter tabs,
  `aria-expanded` / `aria-hidden` on the cart drawer, live regions on result counts.
- Full `prefers-reduced-motion` block — kills the marquee, the spinning stamp,
  reveal transforms and all transition durations.
- Contrast tuned to WCAG AA or better on every text/background pair.

## Responsive

Three breakpoints (1060 / 820 / 560px). Tested at 1440×900 and 390×844 —
zero horizontal overflow at mobile width.

## Notes

- The order tracker and checkout are front-end demos. Wire them to your fulfilment
  API / payment provider to go live.
- Prices, product names and review counts are placeholder content.
