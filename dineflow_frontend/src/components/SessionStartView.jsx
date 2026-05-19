import { useState } from 'react'
import { UserPlus, ArrowRight } from 'lucide-react'

export default function SessionStartView({ onConfirm, onCancel, busy, error }) {
  const [name, setName] = useState('')

  const submit = (e) => {
    e?.preventDefault?.()
    if (!name.trim()) return
    onConfirm(name.trim())
  }

  return (
    <div className="p-8 sm:p-10">
      <div className="w-14 h-14 rounded-2xl bg-moss-100 text-moss-700 flex items-center justify-center mb-6">
        <UserPlus size={22} />
      </div>

      <h2 className="font-display text-[34px] leading-tight tracking-tighter2 text-ink mb-2">
        Who's joining<br/><span className="italic">us tonight?</span>
      </h2>
      <p className="text-umber text-[14px] leading-relaxed mb-7 max-w-sm">
        Add a name to open this table. You can start taking orders right after.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.16em] text-umber font-semibold mb-2">
            Customer Name
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aarav Sharma"
            maxLength={80}
            className="input-text font-display text-[20px] tracking-tightish"
          />
        </div>

        {error && (
          <p className="text-sm text-clay-700 font-mono">{error}</p>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Not yet
          </button>
          <button
            type="submit"
            disabled={!name.trim() || busy}
            className="btn-primary"
          >
            {busy ? 'Seating…' : (<>Seat them <ArrowRight size={15} /></>)}
          </button>
        </div>
      </form>
    </div>
  )
}
