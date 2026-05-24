import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { statusOf } from '../lib/status'
import { cls } from '../lib/format'
import SessionStartView from './SessionStartView'
import OrderingView from './OrderingView'
import BillView from './BillView'
import PaymentConfirmModal from './PaymentConfirmModal'

export default function OrderTerminal({
  tableId, table, menu, gstRate,
  onClose, onOccupy, onAddItem, onRemoveItem, onBill, onCheckout, onReset,
  onPrintBill,
}) {
  const [panelView, setPanelView] = useState('main')
  const [bill, setBill] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [paymentChoice, setPaymentChoice] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)

  useEffect(() => {
    if (table?.status === 'billed' && !bill) {
      const subtotal = table.subtotal || 0
      const gst_amount = round2(subtotal * (gstRate || 0.05))
      const grand_total = round2(subtotal + gst_amount)
      setBill({
        table_id: tableId, customer_name: table.customer_name,
        items: table.items, subtotal: round2(subtotal),
        gst_rate: gstRate, gst_amount, grand_total,
      })
      setPanelView('bill')
    }
  }, [table?.status]) // eslint-disable-line

  const wrap = (fn) => async (...args) => {
    setBusy(true); setError(null)
    try { return await fn(...args) }
    catch (e) { setError(e.message); throw e }
    finally { setBusy(false) }
  }

  const handleOccupy = wrap(onOccupy)
  const handleAdd = wrap(onAddItem)
  const handleRemove = wrap(onRemoveItem)
  const handleReset = wrap(onReset)
  const handleGenerate = wrap(async () => {
    const b = await onBill()
    setBill(b); setPanelView('bill')
  })
  const handleCheckout = wrap(async (pm) => {
    const result = await onCheckout(pm)
    setCompletedOrder(result)
  })

  const handlePrintBill = () => bill && onPrintBill?.(bill)

  const s = statusOf(table.status)

  return (
    <div className="fixed inset-0 z-40">
      <button onClick={onClose} className="absolute inset-0 bg-ink/30 animate-fade-in" aria-label="Close terminal" />

      <aside
        role="dialog" aria-modal="true"
        className="absolute right-0 top-0 bottom-0 w-full md:w-[560px] bg-cream shadow-panel
                   animate-slide-in flex flex-col overflow-hidden"
      >
        <header className={cls('px-6 py-5 border-b border-sand/60 flex items-center justify-between', s.cardBg)}>
          <div className="flex items-center gap-4">
            <div className={cls('w-12 h-12 rounded-2xl flex items-center justify-center', s.pillBg)}>
              <span className={cls('font-display num text-[24px] leading-none', s.pillText)}>
                {String(tableId).padStart(2, '0')}
              </span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-umber">Table</div>
              <div className="font-display text-[22px] tracking-tightish text-ink leading-tight">
                {table.customer_name || 'Empty seat'}
              </div>
              <div className={cls(
                'inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tightish uppercase',
                s.pillBg, s.pillText,
              )}>
                <span className={cls('w-1.5 h-1.5 rounded-full', s.dot)} />
                {s.label}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto nice-scroll">
          {table.status === 'available' ? (
            <SessionStartView busy={busy} error={error} onConfirm={handleOccupy} onCancel={onClose} />
          ) : panelView === 'bill' && bill ? (
            <BillView
              bill={bill} busy={busy} error={error}
              onBack={() => setPanelView('main')}
              onSelectPayment={setPaymentChoice}
              onPrintBill={handlePrintBill}
            />
          ) : (
            <OrderingView
              table={table} menu={menu} busy={busy} error={error}
              onAddItem={handleAdd} onRemoveItem={handleRemove}
              onGenerateBill={handleGenerate} onResetTable={handleReset}
            />
          )}
        </div>
      </aside>

      {paymentChoice && bill && !completedOrder && (
        <PaymentConfirmModal
          method={paymentChoice} bill={bill} busy={busy} error={error}
          onCancel={() => setPaymentChoice(null)}
          onConfirm={async () => { await handleCheckout(paymentChoice) }}
        />
      )}

      {completedOrder && (
        <PaymentConfirmModal
          method={paymentChoice} bill={bill} completed={completedOrder}
          onCancel={() => { setCompletedOrder(null); setPaymentChoice(null); onClose() }}
        />
      )}
    </div>
  )
}

const round2 = (n) => Math.round(n * 100) / 100