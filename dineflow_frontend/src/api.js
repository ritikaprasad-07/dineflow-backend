// Thin client for the DineFlow FastAPI backend.
// Override the URL with a VITE_API_URL env var when needed.

const BASE = import.meta.env.VITE_API_URL || 'https://dineflow-api-ek2q.onrender.com'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || JSON.stringify(body)
    } catch { /* ignore */ }
    throw new Error(detail || `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getMeta: () => request('/'),
  getMenu: () => request('/api/menu'),
  getTables: () => request('/api/tables'),
  setup: (total_tables) => request('/api/setup', {
    method: 'POST', body: JSON.stringify({ total_tables }),
  }),
  occupy: (id, customer_name) => request(`/api/tables/${id}/occupy`, {
    method: 'POST', body: JSON.stringify({ customer_name }),
  }),
  order: (id, dish_id) => request(`/api/tables/${id}/order`, {
    method: 'POST', body: JSON.stringify({ dish_id }),
  }),
  removeItem: (id, idx) => request(`/api/tables/${id}/order/${idx}`, {
    method: 'DELETE',
  }),
  bill: (id) => request(`/api/tables/${id}/bill`, { method: 'POST' }),
  checkout: (id, payment_method) => request(`/api/tables/${id}/checkout`, {
    method: 'POST', body: JSON.stringify({ payment_method }),
  }),
  reset: (id) => request(`/api/tables/${id}/reset`, { method: 'POST' }),
  analytics: () => request('/api/analytics/daily'),
}
