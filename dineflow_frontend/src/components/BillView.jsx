import { Banknote, CreditCard, Smartphone, ChevronLeft, Printer } from 'lucide-react'
import { inr, cls } from '../lib/format'

const METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
]

export default function BillView({
  bill, onBack, onSelectPayment, busy, error, onPrintBill,
}) {
  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="btn-ghost -ml-3 text-[13px]">
          <ChevronLeft size={15} />
          Back to order
        </button>
        {onPrintBill && (
          <button
            onClick={onPrintBill}
            className="btn-ghost text-[13px]"
            title="Print pre-payment receipt"
          >
            <Printer size={14} />
            Print Bill
          </button>
        )}
      </div>

      <p className="text-[11px] uppercase tracking-[0.18em] text-saffron-dark font-semibold mb-2">
        ✷ &nbsp; The Bill &nbsp; ✷
      </p>
      <h2 className="font-display text-[32px] leading-[1.05] tracking-tighter2 text-ink mb-1">
        For {bill.customer_name},<br />
        <span className="italic">Table {String(bill.table_id).padStart(2, '0')}.</span>
      </h2>

      <div className="mt-7 mb-6 rounded-3xl bg-ivory border border-sand p-5 shadow-card">
        <ul className="divide-y divide-sand/60">
          {bill.items.map((it, i) => (
            <li key={i} className="flex items-baseline gap-3 py-2.5">
              <span className="font-mono num text-[10px] text-umber bg-cream px-1.5 py-0.5 rounded-md whitespace-nowrap">
                {it.time}
              </span>
              <span className="flex-1 text-[14px] text-ink truncate">{it.dish}</span>
              <span className="font-mono num text-[13px] text-ink">{inr(it.price)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-sand/60 mt-3 pt-3 space-y-1.5 text-[13px]">
          <Row label="Subtotal" value={inr(bill.subtotal)} />
          <Row label={`GST (${Math.round((bill.gst_rate || 0.05) * 100)}%)`} value={inr(bill.gst_amount)} muted />
        </div>

        <div className="border-t border-sand mt-3 pt-4 flex items-baseline justify-between">
          <span className="font-display text-[16px] tracking-tightish text-ink">Grand Total</span>
          <span className="font-display num text-[36px] leading-none tracking-tighter2 text-ink">
            {inr(bill.grand_total)}
          </span>
        </div>
      </div>

      <h3 className="font-display text-[18px] tracking-tightish text-ink mb-3">
        How are they paying?
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelectPayment(id)}
            disabled={busy}
            className={cls(
              'flex flex-col items-center justify-center gap-2 py-5 rounded-2xl',
              'bg-ivory border border-sand hover:border-ink hover:bg-cream',
              'transition active:scale-[0.98] disabled:opacity-50',
            )}
          >
            <Icon size={22} className="text-ink" />
            <span className="text-[13px] font-medium tracking-tightish">{label}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-[12px] font-mono text-clay-700">{error}</p>}
    </div>
  )
}

function Row({ label, value, muted }) {
  return (
    <div className={cls('flex items-baseline justify-between', muted && 'text-umber')}>
      <span>{label}</span>
      <span className="font-mono num">{value}</span>
    </div>
  )
}