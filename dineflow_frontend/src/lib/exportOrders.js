// XLSX export for completed orders.
// Lazy-imports xlsx so it lands in its own chunk.

export async function exportOrdersToExcel(orders, filename) {
    if (!orders || orders.length === 0) {
        throw new Error('No orders to export yet.')
    }

    const XLSX = await import('xlsx')

    const rows = orders.map((o) => {
        const dt = new Date(o.completed_at)
        return {
            'Order ID': o.id,
            'Date': dt.toLocaleDateString('en-IN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
            }),
            'Time': dt.toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            'Table Number': o.table_id,
            'Customer': o.customer_name || '',
            'Items': o.items?.length ?? 0,
            'Subtotal (INR)': o.subtotal,
            'GST (INR)': o.gst,
            'Total Amount (INR)': o.grand_total,
            'Payment Method': (o.payment_method || '').toUpperCase(),
        }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0]).map((k) => ({
        wch: Math.max(k.length + 2, 14),
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')

    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, filename || `dineflow-orders-${stamp}.xlsx`)
}

// CSV fallback (no library) — kept handy.
export function exportOrdersToCSV(orders, filename) {
    if (!orders || orders.length === 0) {
        throw new Error('No orders to export yet.')
    }
    const headers = [
        'Order ID', 'Date', 'Time', 'Table Number', 'Customer',
        'Items', 'Subtotal (INR)', 'GST (INR)', 'Total Amount (INR)', 'Payment Method',
    ]
    const esc = (v) => {
        const s = String(v ?? '')
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [headers.join(',')]
    for (const o of orders) {
        const dt = new Date(o.completed_at)
        lines.push([
            o.id, dt.toLocaleDateString('en-IN'),
            dt.toLocaleTimeString('en-IN', { hour12: false }),
            o.table_id, o.customer_name || '',
            o.items?.length ?? 0, o.subtotal, o.gst, o.grand_total,
            (o.payment_method || '').toUpperCase(),
        ].map(esc).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `dineflow-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}