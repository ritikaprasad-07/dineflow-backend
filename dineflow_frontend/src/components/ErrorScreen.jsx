import { AlertTriangle, RotateCw } from 'lucide-react'

export default function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center paper-bg px-6">
      <div className="max-w-md w-full bg-ivory border border-clay-100 rounded-3xl p-8 shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-clay-50 border border-clay-100 flex items-center justify-center text-clay-500">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl tracking-tightish text-ink mb-1">
              Can't reach the kitchen
            </h2>
            <p className="text-sm text-umber mb-4 leading-relaxed">
              The DineFlow API didn't respond. Make sure the backend is running
              at <span className="font-mono text-ink">{import.meta.env.VITE_API_URL || 'localhost:8000'}</span>.
            </p>
            <p className="text-xs font-mono text-clay-700 bg-clay-50 border border-clay-100 rounded-xl px-3 py-2 mb-5">
              {error}
            </p>
            <button onClick={onRetry} className="btn-primary">
              <RotateCw size={15} />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
