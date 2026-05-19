import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { TrendingUp, ReceiptText, Flame, IndianRupee } from 'lucide-react'
import { api } from '../api'
import { inr, cls } from '../lib/format'

export default function Analytics() {
  const [data, setData]   = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const d = await api.analytics()
        if (alive) setData(d)
      } catch (e) {
        if (alive) setError(e.message)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  if (loading && !data) {
    return <p className="text-umber">Crunching today's numbers…</p>
  }
  if (error) {
    return (
      <p className="text-clay-700 font-mono text-sm bg-clay-50 border border-clay-100 rounded-2xl px-4 py-3">
        {error}
      </p>
    )
  }

  const { total_revenue, total_orders, popular_dishes, peak_hours, payment_breakdown, date } = data

  return (
    <section className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-saffron-dark font-semibold mb-2">
          ✷ &nbsp; End of Day &nbsp; ✷
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[44px] sm:text-[56px] leading-[0.95] tracking-tighter2 text-ink">
            Today's <span className="italic">numbers.</span>
          </h1>
          <p className="text-umber font-mono num text-[13px]">{date}</p>
        </div>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HeroCard
          eyebrow="Total Revenue"
          value={inr(total_revenue)}
          accent="saffron"
          icon={<IndianRupee size={18} />}
        />
        <HeroCard
          eyebrow="Orders Closed"
          value={String(total_orders)}
          accent="ink"
          icon={<ReceiptText size={18} />}
        />
        <HeroCard
          eyebrow="Top Dish"
          value={popular_dishes[0]?.name || '—'}
          sub={popular_dishes[0] ? `${popular_dishes[0].count} served` : ''}
          accent="clay"
          icon={<Flame size={18} />}
          small
        />
      </div>

      {/* Two-col: peak hours + popular dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Peak hours */}
        <div className="lg:col-span-3 bg-ivory border border-sand rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-[22px] tracking-tightish text-ink leading-tight">
                Peak hours
              </h3>
              <p className="text-[12px] text-umber">Orders closed per hour</p>
            </div>
            <TrendingUp size={18} className="text-umber" />
          </div>
          <PeakHoursChart hours={peak_hours} />
        </div>

        {/* Popular dishes */}
        <div className="lg:col-span-2 bg-ivory border border-sand rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-[22px] tracking-tightish text-ink leading-tight">
                Popular dishes
              </h3>
              <p className="text-[12px] text-umber">Ranked by orders</p>
            </div>
            <Flame size={18} className="text-umber" />
          </div>
          <PopularDishes dishes={popular_dishes} />
        </div>
      </div>

      {/* Payment breakdown */}
      {Object.keys(payment_breakdown).length > 0 && (
        <div className="bg-ivory border border-sand rounded-3xl p-6 shadow-card">
          <h3 className="font-display text-[22px] tracking-tightish text-ink leading-tight mb-1">
            Payment mix
          </h3>
          <p className="text-[12px] text-umber mb-5">Revenue by method</p>
          <PaymentMix breakdown={payment_breakdown} total={total_revenue} />
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function HeroCard({ eyebrow, value, sub, accent = 'ink', icon, small }) {
  const accents = {
    saffron: 'bg-saffron text-cream',
    ink:     'bg-ink text-cream',
    clay:    'bg-clay-500 text-cream',
  }
  return (
    <div className="bg-ivory border border-sand rounded-3xl p-6 shadow-card relative overflow-hidden">
      <div className={cls('absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10', accents[accent].split(' ')[0])} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-umber font-semibold">
          {eyebrow}
        </p>
        <div className={cls('w-9 h-9 rounded-full flex items-center justify-center', accents[accent])}>
          {icon}
        </div>
      </div>
      <div className={cls(
        'font-display tracking-tighter2 text-ink leading-none num',
        small ? 'text-[28px]' : 'text-[44px]'
      )}>
        {value}
      </div>
      {sub && <p className="mt-2 text-[12px] text-umber font-mono num">{sub}</p>}
    </div>
  )
}

function PeakHoursChart({ hours }) {
  // Trim to a reasonable working-hours window if everything's zero outside it.
  const data = hours.map(h => ({ ...h, hourLabel: `${String(h.hour).padStart(2,'0')}` }))
  const maxCount = Math.max(...data.map(d => d.order_count), 0)

  if (maxCount === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-umber text-[13px] border border-dashed border-sand rounded-2xl">
        No orders yet today.
      </div>
    )
  }

  return (
    <div className="h-[220px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="hourLabel"
            interval={1}
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#6B5F54' }}
            tickLine={false}
            axisLine={{ stroke: '#D6CCBE' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#6B5F54' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: 'rgba(199,115,22,0.08)' }}
            contentStyle={{
              background: '#FBF7F0',
              border: '1px solid #D6CCBE',
              borderRadius: 12,
              fontSize: 12,
              fontFamily: 'JetBrains Mono',
            }}
            formatter={(v, name, p) => [`${v} order${v !== 1 ? 's' : ''}`, `${p.payload.hourLabel}:00`]}
            labelFormatter={() => ''}
          />
          <Bar dataKey="order_count" radius={[6, 6, 2, 2]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.order_count === maxCount && maxCount > 0 ? '#C77316' : '#3A3530'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PopularDishes({ dishes }) {
  if (!dishes || dishes.length === 0) {
    return (
      <div className="text-umber text-[13px] py-8 text-center border border-dashed border-sand rounded-2xl">
        No dishes served yet.
      </div>
    )
  }

  const top = dishes.slice(0, 8)
  const max = Math.max(...top.map(d => d.count))

  return (
    <ol className="space-y-2.5">
      {top.map((d, i) => (
        <li key={d.name} className="group">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="font-display num text-[14px] text-umber w-5 text-right">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[14px] text-ink truncate">{d.name}</span>
            </div>
            <span className="font-mono num text-[12px] text-ink whitespace-nowrap">
              {d.count}×
            </span>
          </div>
          <div className="ml-8 h-1.5 bg-bone rounded-full overflow-hidden">
            <div
              className="h-full bg-ink rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

function PaymentMix({ breakdown, total }) {
  const COLORS = {
    cash: { bg: 'bg-moss-500',  pill: 'bg-moss-100 text-moss-700' },
    card: { bg: 'bg-slateb-500', pill: 'bg-slateb-100 text-slateb-700' },
    upi:  { bg: 'bg-saffron',    pill: 'bg-honey-100 text-honey-700' },
  }
  const entries = Object.entries(breakdown)

  return (
    <>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden border border-sand bg-bone">
        {entries.map(([method, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          return (
            <div
              key={method}
              className={cls('h-full', COLORS[method]?.bg || 'bg-ink')}
              style={{ width: `${pct}%` }}
              title={`${method}: ${inr(amount)}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entries.map(([method, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          return (
            <div key={method} className="bg-cream border border-sand rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={cls(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                  COLORS[method]?.pill || 'bg-bone text-umber',
                )}>
                  {method}
                </span>
                <span className="font-mono num text-[12px] text-umber">{pct.toFixed(0)}%</span>
              </div>
              <div className="font-display num text-[22px] tracking-tighter2 text-ink leading-none mt-2">
                {inr(amount)}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
