import { useEffect, useState, useCallback } from 'react'
import { api, auth } from './api'
import TopNav from './components/TopNav'
import SetupScreen from './components/SetupScreen'
import LoadingScreen from './components/LoadingScreen'
import ErrorScreen from './components/ErrorScreen'
import TableGrid from './components/TableGrid'
import OrderTerminal from './components/OrderTerminal'
import Analytics from './components/Analytics'
import Login from './components/Login'
import Receipt from './components/Receipt'

export default function App() {
  // ── auth ──────────────────────────────────────────────────────────────
  const [pin, setPin] = useState(() => auth.getPin())

  // ── data ──────────────────────────────────────────────────────────────
  const [meta,       setMeta]       = useState(null)
  const [menu,       setMenu]       = useState(null)
  const [tables,     setTables]     = useState({})
  const [view,       setView]       = useState('tables')
  const [selectedId, setSelectedId] = useState(null)
  const [showSetup,  setShowSetup]  = useState(false)
  const [bootError,  setBootError]  = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // ── print receipt ─────────────────────────────────────────────────────
  const [printable, setPrintable] = useState(null)

  // Trigger window.print() once the Receipt has rendered.
  useEffect(() => {
    if (!printable) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print())
    })
    return () => cancelAnimationFrame(id)
  }, [printable])

  // Clean up after the print dialog closes.
  useEffect(() => {
    const clear = () => setPrintable(null)
    window.addEventListener('afterprint', clear)
    return () => window.removeEventListener('afterprint', clear)
  }, [])

  // ── data loader ───────────────────────────────────────────────────────
  const refreshTables = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await api.getTables()
      setTables(data.tables)
      setMeta((m) => (m ? { ...m, total_tables: data.total } : m))
    } catch (e) { /* 401s handled via event */ }
    finally    { setRefreshing(false) }
  }, [])

  useEffect(() => {
    if (!pin) return
    let cancelled = false
    ;(async () => {
      try {
        const [m, mn, t] = await Promise.all([
          api.getMeta(), api.getMenu(), api.getTables(),
        ])
        if (cancelled) return
        setMeta(m); setMenu(mn); setTables(t.tables)
      } catch (e) {
        if (cancelled) return
        if (e.status !== 401) setBootError(e.message)
      }
    })()
    return () => { cancelled = true }
  }, [pin])

  useEffect(() => {
    return auth.onFailure(() => {
      setPin(null)
      setMeta(null); setMenu(null); setTables({})
      setSelectedId(null); setShowSetup(false); setBootError(null)
    })
  }, [])

  // ── handlers ──────────────────────────────────────────────────────────
  const handleLoginSuccess = (newPin) => {
    auth.setPin(newPin)
    setPin(newPin)
    setBootError(null)
  }

  const handleLogout = () => {
    auth.clearPin()
    setPin(null)
    setMeta(null); setMenu(null); setTables({})
    setSelectedId(null); setShowSetup(false); setBootError(null); setView('tables')
  }

  const printBill = (bill) => setPrintable({ bill })

  // ── gates ─────────────────────────────────────────────────────────────
  if (!pin)                return <Login onSuccess={handleLoginSuccess} />
  if (bootError)           return <ErrorScreen error={bootError} onRetry={() => location.reload()} />
  if (!meta || !menu)      return <LoadingScreen />
  if (showSetup) {
    return (
      <SetupScreen
        defaultValue={meta.total_tables || 10}
        onCancel={() => setShowSetup(false)}
        onConfirm={async (n) => {
          await api.setup(n)
          await refreshTables()
          setShowSetup(false)
        }}
      />
    )
  }

  // ── terminal handlers ─────────────────────────────────────────────────
  const selectedTable = selectedId != null ? tables[selectedId] : null
  const onOccupy     = async (name) => { await api.occupy(selectedId, name);    await refreshTables() }
  const onAddItem    = async (did)  => { await api.order(selectedId, did);      await refreshTables() }
  const onRemoveItem = async (idx)  => { await api.removeItem(selectedId, idx); await refreshTables() }
  const onBill       = async ()     => { const b = await api.bill(selectedId);  await refreshTables(); return b }
  const onCheckout   = async (pm)   => {
    const result = await api.checkout(selectedId, pm)
    await refreshTables()
    return result
  }
  const onResetTable = async ()     => { await api.reset(selectedId); await refreshTables(); setSelectedId(null) }

  return (
    <div className="min-h-screen paper-bg">
      <TopNav
        view={view}
        onChangeView={setView}
        onOpenSetup={() => setShowSetup(true)}
        onRefresh={refreshTables}
        onLogout={handleLogout}
        refreshing={refreshing}
        totalTables={Object.keys(tables).length}
      />

      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-24">
        {view === 'tables' ? (
          <TableGrid tables={tables} onSelect={setSelectedId} />
        ) : (
          <Analytics />
        )}
      </main>

      {selectedId != null && selectedTable && (
        <OrderTerminal
          key={selectedId}
          tableId={selectedId}
          table={selectedTable}
          menu={menu}
          gstRate={meta.gst_rate}
          onClose={() => setSelectedId(null)}
          onOccupy={onOccupy}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onBill={onBill}
          onCheckout={onCheckout}
          onReset={onResetTable}
          onPrintBill={printBill}
        />
      )}

      {/* Hidden on screen; only visible in @media print */}
      {printable && <Receipt bill={printable.bill} />}
    </div>
  )
}