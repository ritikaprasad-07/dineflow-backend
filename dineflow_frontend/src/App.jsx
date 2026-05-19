import { useEffect, useState, useCallback } from 'react'
import { api } from './api'
import TopNav from './components/TopNav'
import SetupScreen from './components/SetupScreen'
import LoadingScreen from './components/LoadingScreen'
import ErrorScreen from './components/ErrorScreen'
import TableGrid from './components/TableGrid'
import OrderTerminal from './components/OrderTerminal'
import Analytics from './components/Analytics'

export default function App() {
  const [meta,       setMeta]       = useState(null)
  const [menu,       setMenu]       = useState(null)
  const [tables,     setTables]     = useState({})
  const [view,       setView]       = useState('tables')  // 'tables' | 'analytics'
  const [selectedId, setSelectedId] = useState(null)
  const [showSetup,  setShowSetup]  = useState(false)
  const [bootError,  setBootError]  = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // ── data loaders ───────────────────────────────────────────────────────
  const refreshTables = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await api.getTables()
      setTables(data.tables)
      setMeta((m) => (m ? { ...m, total_tables: data.total } : m))
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const [m, mn, t] = await Promise.all([
          api.getMeta(), api.getMenu(), api.getTables(),
        ])
        setMeta(m)
        setMenu(mn)
        setTables(t.tables)
      } catch (e) {
        setBootError(e.message)
      }
    })()
  }, [])

  // ── boot / error / setup gates ─────────────────────────────────────────
  if (bootError) {
    return <ErrorScreen error={bootError} onRetry={() => location.reload()} />
  }
  if (!meta || !menu) {
    return <LoadingScreen />
  }
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

  // ── handlers passed into the terminal ──────────────────────────────────
  const selectedTable = selectedId != null ? tables[selectedId] : null

  const onOccupy     = async (name)  => { await api.occupy(selectedId, name);     await refreshTables() }
  const onAddItem    = async (did)   => { await api.order(selectedId, did);       await refreshTables() }
  const onRemoveItem = async (idx)   => { await api.removeItem(selectedId, idx);  await refreshTables() }
  const onBill       = async ()      => { const b = await api.bill(selectedId);   await refreshTables(); return b }
  const onCheckout   = async (pm)    => {
    const result = await api.checkout(selectedId, pm)
    await refreshTables()
    return result
  }
  const onResetTable = async ()      => { await api.reset(selectedId); await refreshTables(); setSelectedId(null) }

  return (
    <div className="min-h-screen paper-bg">
      <TopNav
        view={view}
        onChangeView={setView}
        onOpenSetup={() => setShowSetup(true)}
        onRefresh={refreshTables}
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
        />
      )}
    </div>
  )
}
