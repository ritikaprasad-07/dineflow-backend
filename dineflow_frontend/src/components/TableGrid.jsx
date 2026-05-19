import { STATUS } from '../lib/status'
import TableCard from './TableCard'

export default function TableGrid({ tables, onSelect }) {
  const entries = Object.entries(tables).sort(([a], [b]) => Number(a) - Number(b))
  const counts = countByStatus(entries)

  return (
    <section>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-saffron-dark font-semibold mb-2">
            ✷ &nbsp; Service Floor &nbsp; ✷
          </p>
          <h1 className="font-display text-[44px] sm:text-[56px] leading-[0.95] tracking-tighter2 text-ink">
            Tonight's <span className="italic">tables.</span>
          </h1>
        </div>

        {/* Status legend / live counts */}
        <div className="flex flex-wrap items-center gap-3">
          {['available', 'occupied', 'ordered', 'billed'].map((s) => (
            <LegendChip key={s} status={s} count={counts[s] || 0} />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {entries.map(([id, t]) => (
          <TableCard
            key={id}
            id={id}
            table={t}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </section>
  )
}

function LegendChip({ status, count }) {
  const s = STATUS[status]
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ivory border border-sand">
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      <span className="text-[12px] text-umber tracking-tightish">{s.label}</span>
      <span className="font-mono num text-[12px] text-ink">{count}</span>
    </div>
  )
}

function countByStatus(entries) {
  const out = { available: 0, occupied: 0, ordered: 0, billed: 0 }
  for (const [, t] of entries) {
    if (out[t.status] != null) out[t.status]++
  }
  return out
}
