import { useState } from 'react'
import { Minus, Plus, ArrowRight, X } from 'lucide-react'

export default function SetupScreen({ defaultValue = 10, onConfirm, onCancel }) {
  const [n, setN] = useState(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const bump = (delta) => setN((v) => Math.min(100, Math.max(1, v + delta)))

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      await onConfirm(n)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg relative">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute -top-2 right-0 btn-ghost"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        )}

        {/* Eyebrow */}
        <p className="text-[11px] uppercase tracking-[0.2em] text-saffron-dark font-semibold mb-4">
          ✷ &nbsp; Welcome &nbsp; ✷
        </p>

        {/* Title */}
        <h1 className="font-display text-[52px] leading-[0.95] tracking-tighter2 text-ink mb-3">
          Set the<br/>
          <span className="italic">floor plan.</span>
        </h1>

        <p className="text-umber text-[15px] leading-relaxed mb-10 max-w-md">
          How many tables does your restaurant have? You can change this later
          from settings — all in-flight sessions will be cleared.
        </p>

        {/* Stepper */}
        <div className="bg-ivory border border-sand rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between gap-6">
            <button
              onClick={() => bump(-1)}
              disabled={n <= 1}
              className="w-12 h-12 rounded-full bg-cream border border-sand hover:bg-bone disabled:opacity-40 flex items-center justify-center transition"
              aria-label="Decrease"
            >
              <Minus size={18} />
            </button>

            <div className="text-center">
              <div className="font-display num text-[88px] leading-none tracking-tighter2 text-ink">
                {n}
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-umber mt-2">
                tables
              </div>
            </div>

            <button
              onClick={() => bump(+1)}
              disabled={n >= 100}
              className="w-12 h-12 rounded-full bg-cream border border-sand hover:bg-bone disabled:opacity-40 flex items-center justify-center transition"
              aria-label="Increase"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-sand/70">
            {[6, 10, 16, 24].map((p) => (
              <button
                key={p}
                onClick={() => setN(p)}
                className={
                  'px-3 py-1.5 rounded-full text-[12px] font-mono num transition ' +
                  (n === p
                    ? 'bg-ink text-cream'
                    : 'text-umber hover:bg-cream')
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-clay-700 font-mono">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          {onCancel && (
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
          )}
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? 'Setting up…' : (
              <>Open the restaurant <ArrowRight size={16}/></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
