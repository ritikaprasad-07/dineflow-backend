import { RefreshCw, Settings, LayoutGrid, BarChart3 } from 'lucide-react'
import { cls } from '../lib/format'

export default function TopNav({
  view, onChangeView, onOpenSetup, onRefresh, refreshing, totalTables,
}) {
  return (
    <header className="border-b border-sand/60 bg-cream/70 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-saffron shadow-pop" />
            <div className="absolute inset-1.5 rounded-full bg-cream/30 border border-cream/60" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[26px] leading-none tracking-tighter2 text-ink">
              DineFlow
            </span>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-umber font-medium">
              POS · Analytics
            </span>
          </div>
        </div>

        {/* View switch */}
        <nav className="hidden md:flex items-center gap-1 bg-ivory border border-sand rounded-full p-1">
          <NavTab
            active={view === 'tables'}
            icon={<LayoutGrid size={15} />}
            label="Floor"
            onClick={() => onChangeView('tables')}
          />
          <NavTab
            active={view === 'analytics'}
            icon={<BarChart3 size={15} />}
            label="Analytics"
            onClick={() => onChangeView('analytics')}
          />
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <span className="hidden sm:inline text-[12px] text-umber mr-2 font-mono num">
            {totalTables} tables
          </span>
          <button
            onClick={onRefresh}
            className="btn-ghost"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={cls(refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={onOpenSetup}
            className="btn-ghost"
            title="Setup"
            aria-label="Setup"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Mobile view switch */}
      <div className="md:hidden border-t border-sand/60 px-5 py-2 flex items-center justify-center">
        <div className="flex items-center gap-1 bg-ivory border border-sand rounded-full p-1">
          <NavTab active={view === 'tables'}    icon={<LayoutGrid size={14} />} label="Floor"     onClick={() => onChangeView('tables')} />
          <NavTab active={view === 'analytics'} icon={<BarChart3 size={14} />}  label="Analytics" onClick={() => onChangeView('analytics')} />
        </div>
      </div>
    </header>
  )
}

function NavTab({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cls(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium tracking-tightish transition',
        active
          ? 'bg-ink text-cream shadow-sm'
          : 'text-umber hover:text-ink'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
