import { useState, useMemo } from 'react'
import { Trash2, Plus, ReceiptText, X } from 'lucide-react'
import { inr, cls } from '../lib/format'

export default function OrderingView({
  table, menu, busy, error,
  onAddItem, onRemoveItem, onGenerateBill, onResetTable,
}) {
  const categories = useMemo(() => Object.keys(menu), [menu])
  const [activeCat, setActiveCat] = useState(categories[0])
  const items = table.items || []

  return (
    <div className="flex flex-col h-full">
      {/* CURRENT ORDER */}
      <section className="px-6 pt-6 pb-4 border-b border-sand/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[20px] tracking-tightish text-ink">
            Current order
          </h3>
          {items.length > 0 && (
            <span className="text-[12px] text-umber font-mono num">
              {items.length} item{items.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-ivory/60 p-6 text-center">
            <p className="text-[14px] text-umber">
              Nothing ordered yet. Tap a dish below to add it.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li
                key={`${it.dish_id}-${idx}`}
                className="group flex items-center gap-3 bg-ivory border border-sand/70 rounded-2xl px-3 py-2.5 animate-pop-in"
              >
                <span className="font-mono num text-[10px] uppercase tracking-wider text-umber bg-cream px-1.5 py-0.5 rounded-md">
                  {it.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-ink truncate">{it.dish}</div>
                  <div className="text-[11px] text-umber tracking-tightish">{it.category}</div>
                </div>
                <span className="font-mono num text-[13px] text-ink whitespace-nowrap">
                  {inr(it.price)}
                </span>
                <button
                  onClick={() => onRemoveItem(idx)}
                  disabled={busy}
                  className="opacity-50 hover:opacity-100 hover:text-clay-500 transition p-1"
                  aria-label={`Remove ${it.dish}`}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="mt-3 text-[12px] font-mono text-clay-700">{error}</p>
        )}
      </section>

      {/* MENU */}
      <section className="px-6 pt-5 pb-4 flex-1">
        <h3 className="font-display text-[20px] tracking-tightish text-ink mb-3">
          Menu
        </h3>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cls(
                'px-3.5 py-1.5 rounded-full text-[12px] font-medium tracking-tightish border transition',
                activeCat === c
                  ? 'bg-ink text-cream border-ink'
                  : 'bg-ivory text-umber border-sand hover:text-ink',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Dish list */}
        <ul className="grid grid-cols-1 gap-2">
          {menu[activeCat].map((d) => (
            <li key={d.id}>
              <button
                onClick={() => onAddItem(d.id)}
                disabled={busy}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl
                           bg-ivory border border-sand/80 hover:border-ink/60 hover:bg-cream
                           active:scale-[0.99] transition disabled:opacity-60"
              >
                <div className="text-left min-w-0">
                  <div className="text-[14px] text-ink truncate">{d.name}</div>
                  <div className="text-[11px] font-mono text-umber tracking-wider">{d.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono num text-[13px] text-ink whitespace-nowrap">
                    {inr(d.price)}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-cream border border-sand flex items-center justify-center text-umber group-hover:text-ink">
                    <Plus size={14} />
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* STICKY ACTION BAR */}
      <footer className="sticky bottom-0 bg-cream/95 backdrop-blur-md border-t border-sand/70 px-6 py-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-umber font-semibold">
            Subtotal
          </div>
          <div className="font-display num text-[26px] text-ink leading-tight tracking-tighter2">
            {inr(table.subtotal || 0)}
          </div>
        </div>

        {items.length === 0 ? (
          <button onClick={onResetTable} disabled={busy} className="btn-secondary" title="Cancel session">
            <Trash2 size={15} />
            Cancel
          </button>
        ) : (
          <button onClick={onGenerateBill} disabled={busy} className="btn-primary">
            <ReceiptText size={15} />
            Generate Bill
          </button>
        )}
      </footer>
    </div>
  )
}
