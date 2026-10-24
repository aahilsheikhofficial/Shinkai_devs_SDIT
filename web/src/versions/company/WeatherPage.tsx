import { useEffect, useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, ChevronLeft, ChevronRight, CloudRain, MapPin, Search, X } from 'lucide-react'
import { Card, tooltipStyle } from '../../components/ui'
import { attendance, commuteRoutes, commuteSegments, employees } from '../../data/mock'
import { useWeather, type DayForecast } from '../../data/weather'

/*
 * Weather & commute risk. Everything here is derived from three sources:
 *  - the Open-Meteo forecast (useWeather, up to 5 days, sample data when offline),
 *  - each employee's HR-approved route (commuteRoutes, same as the backend seed),
 *  - today's attendance (actual WFH-for-rain records).
 * Rainfall (mm), rain chance (%) and commute risk are kept separate. Commute risk is a rule, not a measurement:
 */
export const RISK_RULE = {
  heavyMm: 20,       // a day with this much rain counts as heavy
  wetMm: 5,          // below this, roads are treated as dry
  floodBoost: 2,     // flood-prone roads count double
  highScore: 60,     // commute risk score at/above this = High
  mediumScore: 30,   // at/above this = Medium
}
type Level = 'Low' | 'Medium' | 'High'
const levelOf = (score: number): Level => (score >= RISK_RULE.highScore ? 'High' : score >= RISK_RULE.mediumScore ? 'Medium' : 'Low')
const levelNum: Record<Level, number> = { Low: 1, Medium: 2, High: 3 }
const levelChip: Record<Level, string> = { High: 'bg-t-severe/15 text-t-severe', Medium: 'bg-t-moderate/15 text-t-moderate', Low: 'bg-t-free/15 text-t-free' }

/** Risk for one road on one day: rain score (0–100 from mm), doubled on flood-prone roads, capped at 100. */
function segmentScore(rainMm: number, floodProne: boolean) {
  if (rainMm < RISK_RULE.wetMm) return 0
  const base = Math.min(100, (rainMm / (RISK_RULE.heavyMm * 2)) * 100)
  return Math.min(100, base * (floodProne ? RISK_RULE.floodBoost : 1))
}
function causeOf(rainMm: number, floodProne: boolean) {
  if (floodProne && rainMm >= RISK_RULE.heavyMm / 2) return 'Waterlogging'
  if (rainMm >= RISK_RULE.heavyMm) return 'Heavy rainfall'
  return 'Wet road surface'
}

type Emp = { id: string; name: string; route: string }
const allEmps: Emp[] = employees.map(e => ({ id: e.initials, name: e.name, route: e.route }))
const routesList = [...new Set(allEmps.map(e => e.route))]
const fmt = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
const todayIso = () => new Date().toLocaleDateString('en-CA')

export type Row = { key: string; date: string; dateKind: 'Forecast' | 'Observed'; place: string; cause: string; emps: Emp[]; status: string; level?: Level }

export function buildRows(days: DayForecast[], emps: Emp[]): Row[] {
  const rows: Row[] = []
  // Observed today: employees who actually worked from home because of rain (existing attendance status)
  for (const a of attendance.filter(x => x.status === 'WFH (rain)')) {
    const e = allEmps.find(x => x.id === a.initials)
    if (e && emps.some(x => x.id === e.id)) rows.push({ key: `obs-${e.id}`, date: todayIso(), dateKind: 'Observed', place: a.note.replace(/,.*$/, '').replace(/ flood alert$/i, '') || 'Home area', cause: 'Flood alert', emps: [e], status: 'WFH (rain)' })
  }
  // Forecast: each day × road on someone's route with Medium/High risk. Employees are only *potentially* affected.
  for (const d of days) {
    for (const s of commuteSegments) {
      const level = levelOf(segmentScore(d.rainMm, s.floodProne))
      if (level === 'Low') continue
      const on = emps.filter(e => commuteRoutes[e.id]?.includes(s.id))
      if (!on.length) continue
      rows.push({ key: `${d.date}-${s.id}`, date: d.date, dateKind: 'Forecast', place: s.name, cause: causeOf(d.rainMm, s.floodProne), emps: on, status: level === 'High' ? 'High risk' : 'At risk', level })
    }
  }
  return rows
}

const statusChip: Record<string, string> = { 'High risk': 'bg-t-severe/15 text-t-severe', 'At risk': 'bg-t-moderate/15 text-t-moderate', 'WFH (rain)': 'bg-accent/15 text-accent' }

function Names({ emps }: { emps: Emp[] }) {
  const [open, setOpen] = useState(false)
  const shown = open ? emps : emps.slice(0, 3)
  return (
    <span className="text-[13px]">
      {shown.map(e => e.name).join(', ')}
      {emps.length > 3 && <button onClick={() => setOpen(!open)} className="ml-1.5 font-semibold text-accent hover:underline cursor-pointer">{open ? 'show less' : `+${emps.length - 3} more (${emps.length})`}</button>}
    </span>
  )
}

const sel = 'input !w-auto !py-1.5 !px-3 !rounded-full text-xs font-semibold cursor-pointer'

export default function WeatherPage() {
  const w = useWeather()
  const first = w.days[0]?.date ?? todayIso()
  const last = w.days[w.days.length - 1]?.date ?? first
  const [from, setFrom] = useState(first)
  const [to, setTo] = useState(last)
  const [route, setRoute] = useState('All')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [cause, setCause] = useState('All')
  const [page, setPage] = useState(1)
  // keep the range inside what the forecast provider covers (it changes when live data arrives)
  useEffect(() => { setFrom(f => (f < first || f > last ? first : f)); setTo(t => (t > last || t < first ? last : t)) }, [first, last])

  const period = (n: number) => { setFrom(first); setTo(w.days[Math.min(n, w.days.length) - 1]?.date ?? last) }
  const invalid = from > to
  const days = invalid ? [] : w.days.filter(d => d.date >= from && d.date <= to)
  const emps = route === 'All' ? allEmps : allEmps.filter(e => e.route === route)
  const exposure = emps.length ? emps.filter(e => commuteRoutes[e.id]?.some(id => commuteSegments.find(s => s.id === id)?.floodProne)).length / emps.length : 0

  // Commute risk for the day: the worst road on the selected employees' routes
  const chart = days.map(d => {
    const usedSegs = commuteSegments.filter(s => emps.some(e => commuteRoutes[e.id]?.includes(s.id)))
    const score = Math.round(Math.max(0, ...usedSegs.map(s => segmentScore(d.rainMm, s.floodProne))))
    return { label: d.day, rain: d.rainMm, chance: d.chance, risk: score, level: levelOf(score), date: d.date }
  })

  const rows = useMemo(() => buildRows(days, emps), [days, emps])
  const hotspots = useMemo(() => {
    const m = new Map<string, { place: string; level: Level; cause: string; ids: Set<string> }>()
    for (const r of rows.filter(r => r.dateKind === 'Forecast')) {
      const h = m.get(r.place) ?? { place: r.place, level: 'Low' as Level, cause: r.cause, ids: new Set<string>() }
      if (levelNum[r.level!] > levelNum[h.level]) { h.level = r.level!; h.cause = r.cause }
      r.emps.forEach(e => h.ids.add(e.id)) // unique people, no double counting across days
      m.set(r.place, h)
    }
    return [...m.values()].sort((a, b) => levelNum[b.level] - levelNum[a.level] || b.ids.size - a.ids.size)
  }, [rows])

  const needle = q.trim().toLowerCase()
  const filtered = rows.filter(r =>
    (status === 'All' || r.status === status) && (cause === 'All' || r.cause === cause) &&
    (!needle || [r.place, r.cause, ...r.emps.flatMap(e => [e.name, e.route])].some(x => x.toLowerCase().includes(needle))))
  const PER = 6
  const pages = Math.max(1, Math.ceil(filtered.length / PER))
  useEffect(() => setPage(1), [from, to, route, q, status, cause])
  const shown = filtered.slice((page - 1) * PER, page * PER)
  const causes = [...new Set(rows.map(r => r.cause))]
  const statuses = [...new Set(rows.map(r => r.status))]
  const clear = () => { setFrom(first); setTo(last); setRoute('All'); setQ(''); setStatus('All'); setCause('All') }

  const dateRange = (
    <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold">
      <CalendarDays size={14} className="text-muted" />
      <input type="date" className="bg-transparent outline-none" value={from} min={first} max={last} onChange={e => setFrom(e.target.value)} aria-label="From date" />
      –
      <input type="date" className="bg-transparent outline-none" value={to} min={first} max={last} onChange={e => setTo(e.target.value)} aria-label="To date" />
    </span>
  )
  const routeSel = (
    <select className={sel} value={route} onChange={e => setRoute(e.target.value)} aria-label="Route">
      <option value="All">All routes</option>{routesList.map(r => <option key={r}>{r}</option>)}
    </select>
  )
  const ctx = <span className="text-xs font-medium text-muted">({route === 'All' ? 'All Mangaluru commute routes' : route})</span>
  const source = <span className={`chip ${w.live ? 'bg-t-free/15 text-t-free' : 'bg-surface-2 text-muted'}`}>{w.live ? 'Live · Open-Meteo' : 'Sample forecast (offline)'}</span>

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] items-start">
        <Card title={<span className="flex flex-wrap items-center gap-2"><CloudRain size={18} className="text-teal" /> Monsoon Risk Forecast {ctx}</span>}
          action={source}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {dateRange}
            <select className={sel} value={days.length === w.days.length ? 5 : days.length === 3 && from === first ? 3 : 0} onChange={e => period(Number(e.target.value))} aria-label="Forecast period">
              <option value={5}>Next 5 days</option><option value={3}>Next 3 days</option><option value={0} disabled>Custom range</option>
            </select>
            {routeSel}
          </div>
          {invalid ? <p className="py-16 text-center text-sm text-muted">The start date is after the end date.</p> : !chart.length ? <p className="py-16 text-center text-sm text-muted">No forecast available for this range.</p> : (
            <>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={chart} margin={{ left: -10, right: 0, top: 18 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <YAxis yAxisId="mm" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', offset: 20, fill: 'var(--muted)', fontSize: 11 }} />
                    <YAxis yAxisId="risk" orientation="right" domain={[0, 100]} ticks={[15, 45, 80]} axisLine={false} tickLine={false} width={58}
                      tickFormatter={v => (v >= RISK_RULE.highScore ? 'High' : v >= RISK_RULE.mediumScore ? 'Medium' : 'Low')} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} formatter={(v, n) => (n === 'Commute risk' ? `${v} / 100 (${levelOf(Number(v))})` : `${v} mm`)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="mm" dataKey="rain" name="Rainfall (mm)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={34} label={{ position: 'top', fill: 'var(--muted)', fontSize: 11 }} />
                    <Line yAxisId="risk" dataKey="risk" name="Commute risk" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${chart.length}, minmax(0, 1fr))` }}>
                {chart.map(c => (
                  <div key={c.date} className="text-center">
                    <div className="text-[11px] text-muted">{fmt(c.date)} · {c.chance}% chance</div>
                    <span className={`chip mt-1 ${levelChip[c.level]}`}>{c.level}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted">Commute risk = worst road on the selected routes: rain score from forecast mm, doubled on flood-prone roads ({Math.round(exposure * 100)}% of these employees cross one). Rain chance is shown separately.</p>
            </>
          )}
        </Card>

        <Card title={<span className="flex flex-wrap items-center gap-2"><MapPin size={18} className="text-accent" /> Weather Hotspots {ctx}</span>}>
          {!hotspots.length ? <p className="py-10 text-center text-sm text-muted">No road on these routes reaches Medium risk in this range.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-[13px]">
                <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">#</th><th className="font-semibold">Location / Road</th><th className="font-semibold whitespace-nowrap">Risk Level</th><th className="font-semibold">Expected Cause</th><th className="font-semibold text-right">Affected</th></tr></thead>
                <tbody>
                  {hotspots.slice(0, 6).map((h, i) => (
                    <tr key={h.place} className="border-t border-line hover:bg-surface-2 transition-colors">
                      <td className="py-2.5 pr-2 text-muted">{i + 1}</td>
                      <td className="pr-2 font-semibold">{h.place}</td>
                      <td className="pr-2"><span className={`chip ${levelChip[h.level]}`}>{h.level}</span></td>
                      <td className="pr-2">{h.cause}</td>
                      <td className="text-right font-bold">{h.ids.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted">Expected causes are predictions from the forecast, not confirmed incidents. Ranked by highest forecast risk in the range, then by how many employees' HR-approved routes cross the road (each person counted once).</p>
        </Card>
      </div>

      <Card title={<span className="flex flex-wrap items-center gap-2"><CloudRain size={18} className="text-teal" /> Weather Impact &amp; Affected Employees {ctx}</span>}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {dateRange}
          <label className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !w-56 !py-1.5 !pl-8 !rounded-full text-xs" placeholder="Search location, employee…" value={q} onChange={e => setQ(e.target.value)} />
          </label>
          {routeSel}
          <select className={sel} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status"><option value="All">All status</option>{statuses.map(s => <option key={s}>{s}</option>)}</select>
          <select className={sel} value={cause} onChange={e => setCause(e.target.value)} aria-label="Cause"><option value="All">All causes</option>{causes.map(s => <option key={s}>{s}</option>)}</select>
          <button className="btn !py-1.5 text-xs" onClick={clear}><X size={13} /> Clear</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">#</th><th className="font-semibold">Date</th><th className="font-semibold">Location / Road</th><th className="font-semibold">Predicted Cause</th><th className="font-semibold">Employees Affected</th><th className="font-semibold">Route</th><th className="font-semibold">Status</th></tr></thead>
            <tbody>
              {shown.map((r, i) => {
                const rs = [...new Set(r.emps.map(e => e.route))]
                return (
                  <tr key={r.key} className="border-t border-line align-top hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 pr-2 text-muted">{(page - 1) * PER + i + 1}</td>
                    <td className="pr-3 whitespace-nowrap">{fmt(r.date)}<div className="text-[11px] text-muted">{r.dateKind}</div></td>
                    <td className="pr-3 font-semibold">{r.place}</td>
                    <td className="pr-3">{r.cause}{r.dateKind === 'Forecast' && <div className="text-[11px] text-muted">predicted</div>}</td>
                    <td className="pr-3 max-w-[260px]"><Names emps={r.emps} />{r.dateKind === 'Forecast' && <div className="text-[11px] text-muted">potentially affected</div>}</td>
                    <td className="pr-3 text-muted">{rs[0]}{rs.length > 1 && <span className="text-[11px]"> +{rs.length - 1} routes</span>}</td>
                    <td><span className={`chip whitespace-nowrap ${statusChip[r.status]}`}>{r.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!shown.length && <p className="py-10 text-center text-sm text-muted">No records match these filters. <button className="font-semibold text-accent hover:underline cursor-pointer" onClick={clear}>Clear filters</button></p>}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>Showing {filtered.length ? (page - 1) * PER + 1 : 0}–{Math.min(page * PER, filtered.length)} of {filtered.length} records</span>
          <span className="flex items-center gap-1">
            <button className="btn btn-icon !p-1.5" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
            {Array.from({ length: pages }, (_, k) => <button key={k} onClick={() => setPage(k + 1)} className={`btn !py-1 !px-2.5 text-xs ${page === k + 1 ? 'pill-active' : ''}`}>{k + 1}</button>)}
            <button className="btn btn-icon !p-1.5" disabled={page === pages} onClick={() => setPage(p => p + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
          </span>
        </div>
      </Card>
    </div>
  )
}
