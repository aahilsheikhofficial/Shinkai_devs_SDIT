import { useCallback, useEffect, useState } from 'react'
import { geo, incidents as mockIncidents, type Incident, type Level, type Reason } from './mock'

/*
 * One place for backend calls. When VITE_API_BASE_URL is set and the server answers, pages use live data.
 * Otherwise they keep the bundled demo data and say so; nothing pretends to be live.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
export const hasApi = API_BASE.length > 0

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  if (!hasApi) throw new ApiError('No backend configured (VITE_API_BASE_URL in web/.env).')
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      headers: { ...(init?.json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      signal: init?.signal ?? AbortSignal.timeout(10000),
    })
  } catch {
    throw new ApiError(`Backend not reachable at ${API_BASE}. Is uvicorn running?`)
  }
  if (!res.ok) {
    const detail = await res.json().then(j => j.detail, () => null)
    throw new ApiError(typeof detail === 'string' ? detail : `Server error ${res.status}`)
  }
  return res.json()
}

// Any successful write tells every live list to reload
const listeners = new Set<() => void>()
export const dataChanged = () => listeners.forEach(f => f())

/** Live list from the backend with a demo-data fallback. */
export function useLive<T>(path: string, fallback: T, adapt: (raw: any) => T = x => x) {
  const [data, setData] = useState<T>(fallback)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(hasApi)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    if (!hasApi) return
    setLoading(true)
    api<unknown>(path)
      .then(raw => { setData(adapt(raw)); setLive(true); setError(null) })
      .catch((e: Error) => { setLive(false); setError(e.message) })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])
  useEffect(() => { load(); listeners.add(load); return () => { listeners.delete(load) } }, [load])
  return { data, setData, live, loading, error, reload: load }
}

// ---- Shape adapters (backend camelCase -> web types) ----

// Linear fit between real coordinates and the drawn SVG map, from the demo incidents that have both
const pairs = mockIncidents.map(i => ({ i, g: geo.incidents[i.id] })).filter(p => p.g)
function fit(key: 'x' | 'y', by: 'lng' | 'lat') {
  const n = pairs.length, xs = pairs.map(p => p.g[by]), ys = pairs.map(p => p.i[key])
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n
  const k = xs.reduce((a, x, j) => a + (x - mx) * (ys[j] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  return (v: number) => my + k * (v - mx)
}
const toX = fit('x', 'lng'), toY = fit('y', 'lat')
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

type RawIncident = { id: string; reason: Reason; place: string; lat: number; lng: number; level: Level; delayMin: number; confidence: number; verification: number; reports: number; since: string; agency: string | null }
export const adaptIncidents = (raw: RawIncident[]): Incident[] => raw.map(r => {
  const known = mockIncidents.find(m => m.id === r.id)
  return {
    id: r.id, reason: r.reason, place: r.place, level: r.level, delayMin: r.delayMin, confidence: r.confidence,
    verification: Math.min(6, Math.max(1, r.verification)) as Incident['verification'], reports: r.reports,
    since: hhmm(r.since), agency: r.agency ?? undefined, lat: r.lat, lng: r.lng,
    x: known?.x ?? Math.round(toX(r.lng)), y: known?.y ?? Math.round(toY(r.lat)),
  }
})

export const useIncidents = () => useLive<Incident[]>('/incidents', mockIncidents, adaptIncidents)

/** Browser location for reports; falls back to the city centre (and says so) when denied. */
export function currentPosition(): Promise<{ lat: number; lng: number; real: boolean }> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ lat: 12.872, lng: 74.862, real: false })
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, real: true }),
      () => resolve({ lat: 12.872, lng: 74.862, real: false }),
      { timeout: 5000 },
    )
  })
}

export type ReportResult = { incident: { id: string; verification: number; reports: number }; merged: boolean; verificationSteps: string[] }
export async function sendReport(reason: string, opts: { place?: string; hasPhoto?: boolean; reporter?: string } = {}) {
  const pos = await currentPosition()
  const r = await api<ReportResult>('/incidents/report', { method: 'POST', json: { reason, place: opts.place, lat: pos.lat, lng: pos.lng, hasPhoto: !!opts.hasPhoto, reporter: opts.reporter ?? 'web' } })
  dataChanged()
  return { ...r, realLocation: pos.real }
}

/** Save text as a file in the browser. */
export function downloadFile(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Open a printable page so the browser's "Save as PDF" makes the PDF. */
export function printAsPdf(title: string, html: string) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:32px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}small{color:#666}</style></head><body>${html}<script>onload=()=>print()</script></body></html>`)
  w.document.close()
  return true
}
