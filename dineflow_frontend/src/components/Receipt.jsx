import { config } from '../lib/config'

/**
 * Receipt — rendered into the DOM only when a print is triggered.
 * Hidden on screen via `display: none`; @media print swaps it in.
 *
 * Props:
 *   bill: { table_id, customer_name, items[], subtotal, gst_rate, gst_amount, grand_total }
 */
export default function Receipt({ bill }) {
  if (!bill) return null

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const gstPct  = Math.round((bill.gst_rate || 0.05) * 100)

  return (
    <div className="print-receipt">
      <div className="r-header">
        <div className="r-name">{config.restaurantName}</div>
        <div className="r-loc">{config.restaurantLocation}</div>
      </div>

      <div className="r-divider r-divider-bold" />

      <div className="r-meta">
        <div className="r-row"><span>Date</span><span>{dateStr}</span></div>
        <div className="r-row"><span>Time</span><span>{timeStr}</span></div>
        <div className="r-row">
          <span>Table</span>
          <span>{String(bill.table_id).padStart(2, '0')}</span>
        </div>
        {bill.customer_name && (
          <div className="r-row"><span>Guest</span><span>{bill.customer_name}</span></div>
        )}
      </div>

      <div className="r-divider" />

      <div className="r-items">
        <div className="r-row r-items-head">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {bill.items.map((it, i) => (
          <div key={i} className="r-row r-item">
            <span className="r-item-name">{it.dish}</span>
            <span>{it.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="r-divider" />

      <div className="r-totals">
        <div className="r-row"><span>Subtotal</span><span>{bill.subtotal.toFixed(2)}</span></div>
        <div className="r-row"><span>GST ({gstPct}%)</span><span>{bill.gst_amount.toFixed(2)}</span></div>
      </div>

      <div className="r-divider r-divider-bold" />

      <div className="r-row r-grand">
        <span>TOTAL</span>
        <span>&#8377;{bill.grand_total.toFixed(2)}</span>
      </div>

      <div className="r-divider r-divider-bold" />

      <div className="r-footer">
        <div>Thank you for dining with us!</div>
        <div>Please visit again ✦</div>
      </div>
    </div>
  )
}