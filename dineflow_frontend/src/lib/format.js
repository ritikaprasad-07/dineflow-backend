// Indian Rupee formatting + small helpers.

const NF = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export const inr = (n) =>
  NF.format(Number.isFinite(n) ? n : 0)

// Compact, no-symbol — for inline use after a ₹ glyph elsewhere
export const inrShort = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
    .format(Math.round(Number.isFinite(n) ? n : 0))

export const cls = (...parts) => parts.filter(Boolean).join(' ')
