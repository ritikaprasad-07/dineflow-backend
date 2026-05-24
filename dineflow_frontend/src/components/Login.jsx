import { useEffect, useRef, useState } from 'react'
import { Lock, ArrowRight } from 'lucide-react'
import { verifyPin } from '../api'
import { cls } from '../lib/format'

export default function Login({ onSuccess }) {
  const [pin, setPin]     = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState(null)

  const submit = async (candidate) => {
    if (candidate.length !== 4 || busy) return
    setBusy(true); setError(null)
    const res = await verifyPin(candidate)
    if (res.ok) { onSuccess(candidate); return }
    setBusy(false); setPin('')
    if (res.reason === 'wrong-pin')      setError('Wrong PIN. Try again.')
    else if (res.reason === 'network')   setError('Can\u2019t reach the server.')
    else                                 setError('Server error. Try again.')
  }

  useEffect(() => {
    if (pin.length === 4) submit(pin)
    // eslint-disable-next-line
  }, [pin])

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-saffron shadow-pop" />
            <div className="absolute inset-1.5 rounded-full bg-cream/30 border border-cream/60" />
          </div>
          <span className="font-display text-[26px] leading-none tracking-tighter2 text-ink">
            DineFlow
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-saffron-dark font-semibold mb-3">
          ✷ &nbsp; Restricted &nbsp; ✷
        </p>

        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-tighter2 text-ink mb-3">
          Enter the<br/>
          <span className="italic">access PIN.</span>
        </h1>

        <p className="text-umber text-[14px] leading-relaxed mb-10 max-w-sm">
          This dashboard is private. Punch in your 4-digit PIN to step inside.
        </p>

        <PinInput value={pin} onChange={setPin} busy={busy} error={!!error} />

        <div className="mt-6 h-6 flex items-center justify-center">
          {busy ? (
            <div className="flex items-center gap-2 text-umber text-[13px]">
              <Lock size={13} className="animate-pulse" /> Verifying…
            </div>
          ) : error ? (
            <div className="text-clay-700 text-[13px] font-mono">{error}</div>
          ) : (
            <div className="text-umber/60 text-[12px]">
              The PIN auto-submits when you finish typing.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => submit(pin)}
            disabled={pin.length !== 4 || busy}
            className="btn-primary"
          >
            Unlock <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PinInput({ value, onChange, busy, error }) {
  const refs = useRef([])
  const digits = Array.from({ length: 4 }, (_, i) => value[i] || '')

  const setDigit = (i, d) => {
    const cleaned = (d || '').replace(/\D/g, '').slice(-1)
    const arr = digits.slice(); arr[i] = cleaned
    onChange(arr.join('').replace(/\s/g, '').slice(0, 4))
    if (cleaned && i < 3) refs.current[i + 1]?.focus()
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 3) refs.current[i + 1]?.focus()
  }

  const onPaste = (e) => {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 4)
    if (pasted.length) {
      e.preventDefault()
      onChange(pasted)
      refs.current[Math.min(pasted.length, 3)]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          autoFocus={i === 0}
          disabled={busy}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          className={cls(
            'w-14 h-20 sm:w-16 sm:h-24 text-center font-display num',
            'text-[36px] sm:text-[44px] tracking-tighter2',
            'bg-ivory border-2 border-sand rounded-2xl',
            'focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10',
            'transition disabled:opacity-50',
            error && 'border-clay-500 bg-clay-50 animate-pop-in',
          )}
        />
      ))}
    </div>
  )
}