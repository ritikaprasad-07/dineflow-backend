// Thin client for the DineFlow FastAPI backend.
// Override the URL with VITE_API_URL.
//
// Every request automatically carries the saved PIN in `x-access-pin`.
// On 401, we clear the stored PIN and dispatch a window event so App.jsx
// can return the user to the Login screen.

const BASE = import.meta.env.VITE_API_URL || 'https://dineflow-api-ek2q.onrender.com'

const PIN_KEY = 'dineflow_pin'
const AUTH_FAILED_EVENT = 'dineflow:auth-failed'

export const auth = {
  getPin() { try { return localStorage.getItem(PIN_KEY) } catch { return null } },
  setPin(pin) { try { localStorage.setItem(PIN_KEY, pin) } catch { } },
  clearPin() { try { localStorage.removeItem(PIN_KEY) } catch { } },
  emitFailure() { window.dispatchEvent(new Event(AUTH_FAILED_EVENT)) },
  onFailure(fn) {
    window.addEventListener(AUTH_FAILED_EVENT, fn)
    return () => window.removeEventListener(AUTH_FAILED_EVENT, fn)
  },
}

async function request(path, options = {}) {
  const pin = auth.getPin()
  const headers = {
    'Content-Type': 'application/json',
    ...(pin ? { 'x-access-pin': pin } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    auth.clearPin()
    auth.emitFailure()
    const e = new Error('Unauthorized — please log in again')
    e.status = 401
    throw e
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || JSON.stringify(body)
    } catch { /* ignore */ }
    const e = new Error(detail || `Request failed (${res.status})`)
    e.status = res.status
    throw e
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getMeta: () => request('/'),
  getMenu: () => request('/api/menu'),
  getTables: () => request('/api/tables'),
  getOrders: () => request('/api/analytics/orders'),
  setup: (total_tables) => request('/api/setup', { method: 'POST', body: JSON.stringify({ total_tables }) }),
  occupy: (id, customer_name) => request(`/api/tables/${id}/occupy`, { method: 'POST', body: JSON.stringify({ customer_name }) }),
  order: (id, dish_id) => request(`/api/tables/${id}/order`, { method: 'POST', body: JSON.stringify({ dish_id }) }),
  removeItem: (id, idx) => request(`/api/tables/${id}/order/${idx}`, { method: 'DELETE' }),
  bill: (id) => request(`/api/tables/${id}/bill`, { method: 'POST' }),
  checkout: (id, payment_method) => request(`/api/tables/${id}/checkout`, { method: 'POST', body: JSON.stringify({ payment_method }) }),
  reset: (id) => request(`/api/tables/${id}/reset`, { method: 'POST' }),
  analytics: () => request('/api/analytics/daily'),
}

// Used by the Login screen — verifies a PIN without saving it.
export async function verifyPin(candidate) {
  try {
    const res = await fetch(`${BASE}/api/menu`, {
      headers: { 'x-access-pin': candidate },
    })
    if (res.ok) return { ok: true }
    if (res.status === 401) return { ok: false, reason: 'wrong-pin' }
    return { ok: false, reason: `server-${res.status}` }
  } catch {
    return { ok: false, reason: 'network' }
  }
}