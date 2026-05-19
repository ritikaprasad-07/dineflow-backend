# DineFlow Frontend (React + Vite + Tailwind)

A warm, editorial restaurant POS UI built on top of the DineFlow FastAPI
backend. Built with **Vite + React 18 + Tailwind CSS v3 + Recharts**.

## Quick start

```bash
# 1. Make sure the backend is running (in another terminal):
#    cd ../dineflow_backend && python main.py
#    → http://localhost:8000

# 2. Install + run the frontend dev server:
cd dineflow_frontend
npm install
npm run dev
#    → http://localhost:5173
```

The frontend points at `http://localhost:8000` by default. To override,
copy `.env.example` to `.env.local` and set `VITE_API_URL`.

```bash
cp .env.example .env.local
# edit VITE_API_URL=https://your-backend.example.com
```

Production build:

```bash
npm run build      # → dist/
npm run preview    # serves dist/ locally for verification
```

## What's in here

```
src/
├── main.jsx                        React entry
├── App.jsx                         Top-level state + view routing
├── index.css                       Tailwind + global styles
├── api.js                          Fetch wrapper for the FastAPI backend
├── lib/
│   ├── status.js                   Status → Tailwind class mapping
│   └── format.js                   ₹ formatting + cls() helper
└── components/
    ├── TopNav.jsx                  Brand wordmark + Floor/Analytics tabs
    ├── SetupScreen.jsx             First-run / settings: pick table count
    ├── LoadingScreen.jsx
    ├── ErrorScreen.jsx
    ├── TableGrid.jsx               Floor grid + status legend
    ├── TableCard.jsx               One table card, colour-coded by status
    ├── OrderTerminal.jsx           Slide-in side panel (the Terminal)
    ├── SessionStartView.jsx          ↳ enter customer name
    ├── OrderingView.jsx              ↳ items list + categorised menu
    ├── BillView.jsx                  ↳ bill detail + payment selector
    ├── PaymentConfirmModal.jsx     Confirm cash/card/UPI + success state
    └── Analytics.jsx               Revenue, peak hours, popular dishes, payment mix
```

## Design direction

**Warm hospitality / editorial.** Cream/bone backgrounds, deep ink text, a
single saffron accent. The four table statuses use muted, restaurant-feel
versions of the spec colours rather than crayola saturation:

| Spec colour | Status     | Used as          |
|-------------|------------|------------------|
| Green       | Available  | moss             |
| Yellow      | Occupied   | honey            |
| Blue        | Ordered    | slate-blue (slateb) |
| Red         | Billed     | clay             |

**Typography:**
- `Fraunces` — display serif for headings & numbers (variable, with optical sizing)
- `Plus Jakarta Sans` — body
- `JetBrains Mono` — prices, timestamps, dish IDs

All from Google Fonts; loaded via the `<head>` of `index.html`.

## State & data flow

`App.jsx` is the single owner of:
- `meta` (server info, GST rate)
- `menu` (categorised dish data)
- `tables` (current snapshot)
- `selectedId` (which table's terminal is open)
- `view` (`'tables' | 'analytics'`)

After every mutation (occupy / add item / remove item / bill / checkout /
reset) the app re-fetches `/api/tables` to stay consistent with the
backend, then passes the fresh `table` prop into the open `OrderTerminal`.

The Analytics view polls `/api/analytics/daily` every 15 s while it's
mounted.

## Workflow

1. **Floor view (default).** Grid of TableCards. Status legend at the top
   shows live counts per status.
2. **Click a table.** Side panel slides in from the right (becomes
   full-screen on mobile).
   - If **Available** → prompts for customer name.
   - If **Occupied / Ordered** → shows current items (with timestamps) +
     the categorised menu picker. Subtotal lives in a sticky footer.
3. **Generate Bill.** Backend computes subtotal + 5% GST → flips the table
   to *Billed* (red) and the panel switches to the bill view.
4. **Pick a payment method.** A modal asks to confirm Cash / Card / UPI.
   On confirm, the order is persisted to SQLite, the table goes back to
   *Available*, and a success state shows the closed order number.
5. **Analytics tab.** Hero metrics + peak-hour bar chart + ranked popular
   dishes + payment-mix breakdown.

## Notes

- The dev server uses Vite's HMR — edits to components reload instantly.
- CORS on the backend is set to `*` for local dev, so any port works.
- The Recharts bundle is ~150 kB gzipped. Acceptable for an internal POS;
  if you want to slim it, lazy-load `Analytics.jsx` with `React.lazy`.
