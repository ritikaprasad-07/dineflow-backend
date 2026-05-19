import { Users, Utensils, Receipt, Sparkles } from 'lucide-react'
import { statusOf } from '../lib/status'
import { inr, cls } from '../lib/format'

const ICONS = {
  available: Sparkles,
  occupied:  Users,
  ordered:   Utensils,
  billed:    Receipt,
}

export default function TableCard({ id, table, onClick }) {
  const s = statusOf(table.status)
  const Icon = ICONS[table.status] || Sparkles
  const itemCount = table.items?.length || 0

  return (
    <button
      onClick={onClick}
      className={cls(
        'group relative text-left rounded-3xl border overflow-hidden',
        'shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0',
        'transition-all duration-200',
        s.cardBg, s.cardEdge,
      )}
    >
      {/* Top accent bar */}
      <span className={cls('absolute top-0 inset-x-0 h-1', s.barTop)} />

      <div className="p-5 pt-6 min-h-[170px] flex flex-col justify-between">
        {/* Row 1: number + icon */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-umber font-medium">
              Table
            </div>
            <div className="font-display num text-[40px] leading-none tracking-tighter2 text-ink mt-1">
              {String(id).padStart(2, '0')}
            </div>
          </div>
          <div className={cls(
            'w-9 h-9 rounded-full flex items-center justify-center',
            s.pillBg, s.pillText,
          )}>
            <Icon size={16} />
          </div>
        </div>

        {/* Row 2: status + details */}
        <div className="mt-4 space-y-2">
          <div className={cls(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tightish',
            s.pillBg, s.pillText,
          )}>
            <span className={cls('w-1.5 h-1.5 rounded-full', s.dot)} />
            {s.label}
          </div>

          {table.customer_name && (
            <div className="text-[13px] text-ink-2 truncate">
              {table.customer_name}
            </div>
          )}

          {itemCount > 0 && (
            <div className="flex items-center justify-between pt-1 text-[12px] text-umber">
              <span className="font-mono num">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
              <span className="font-mono num text-ink">{inr(table.subtotal)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
