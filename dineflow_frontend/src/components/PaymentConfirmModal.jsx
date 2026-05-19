import { Banknote, CreditCard, Smartphone, CheckCircle2, X } from 'lucide-react'
import { inr } from '../lib/format'

const ICONS = {
  cash: Banknote,
  card: CreditCard,
  upi:  Smartphone,
}
const LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI' }

export default function PaymentConfirmModal({
  method, bill, busy, error,
  onConfirm, onCancel, completed,
}) {
  const Icon = ICONS[method] || Banknote

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 animate-fade-in">
      <button
        className="absolute inset-0 bg-ink/55"
        onClick={onCancel}
        aria-label="Close"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-cream rounded-3xl shadow-pop border border-sand
                   p-7 animate-pop-in"
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 btn-ghost"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {completed ? (
          <SuccessBody completed={completed} method={method} onClose={onCancel} />
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-honey-100 text-honey-700 flex items-center justify-center mb-5">
              <Icon size={22} />
            </div>

            <p className="text-[11px] uppercase tracking-[0.18em] text-umber font-semibold mb-1">
              Confirm Payment
            </p>
            <h3 className="font-display text-[28px] leading-tight tracking-tighter2 text-ink mb-1">
              {inr(bill.grand_total)} <span className="italic text-umber text-[18px]">via {LABELS[method]}</span>
            </h3>
            <p className="text-[13px] text-umber leading-relaxed mb-6">
              Charging {bill.customer_name} for {bill.items.length} item{bill.items.length > 1 ? 's' : ''} on Table {String(bill.table_id).padStart(2,'0')}.
            </p>

            {error && (
              <p className="mb-4 text-[12px] font-mono text-clay-700 bg-clay-50 border border-clay-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={onCancel} className="btn-secondary" disabled={busy}>
                Back
              </button>
              <button onClick={onConfirm} className="btn-primary" disabled={busy}>
                {busy ? 'Processing…' : `Confirm ${LABELS[method]}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SuccessBody({ completed, method, onClose }) {
  return (
    <div className="text-center py-2">
      <div className="w-16 h-16 rounded-full bg-moss-100 text-moss-700 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={28} />
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-moss-700 font-semibold mb-1">
        Paid
      </p>
      <h3 className="font-display text-[34px] leading-tight tracking-tighter2 text-ink mb-1 num">
        {inr(completed.grand_total)}
      </h3>
      <p className="text-[13px] text-umber mb-1">
        Order #{completed.order_id} closed via {LABELS[method]}
      </p>
      <p className="text-[12px] text-umber mb-6">
        Table {String(completed.table_id).padStart(2,'0')} is back to available.
      </p>
      <button onClick={onClose} className="btn-primary w-full">
        Done
      </button>
    </div>
  )
}
