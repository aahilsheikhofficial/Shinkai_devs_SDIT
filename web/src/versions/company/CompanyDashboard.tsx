import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowRight, Award, BellRing, Brain, CalendarCheck, Check, CloudRain, EyeOff, Eye, FileText, LayoutDashboard, Landmark, Lock, Map as MapIcon, Medal,
  Scale, Send, ShieldCheck, Sparkles, TrendingDown, TrendingUp, UserCheck, Users,
} from 'lucide-react'
import WeatherPage from './WeatherPage'
import ReportsPage from './ReportsPage'
import EmployeeStatusPage from './EmployeeStatusPage'
import { api, hasApi, useIncidents } from '../../data/api'
import { notify } from '../../components/toast'
import CompanyShell, { type NavItem } from '../../components/CompanyShell'
import TrafficMap from '../../components/TrafficMap'
import { useThemeMode } from '../../components/theme'
import { Card, Confidence, LevelChip, StatTile, tooltipStyle } from '../../components/ui'
import {
  affectedBy, attendance, employees, fairLateness, isConfirmed, levelLabel, honesty, lateArrivals, sharedWithGov, WORKDAYS_30, type BadgeTier,
} from '../../data/mock'

const nav: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'weather', label: 'Weather', icon: CloudRain },
  { id: 'status', label: 'Status / Employees', icon: UserCheck },
  { id: 'reports', label: 'Reports', icon: FileText },
]
const reportTabs = ['Shared with Gov', 'Fair lateness', 'Badges', 'Privacy']
const SHIFT_START = '09:00'
const REGULAR_LATE_MIN_DAYS = 3 // late on 3+ of the last 30 days' working days

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
const routeOf = (initials: string) => employees.find(e => e.initials === initials)?.route

/** Today's real arrivals only: rows with a gate/geofence time. WFH and absent are not arrivals. */
function todaysArrivals() {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return attendance
    .filter(a => /^\d{1,2}:\d{2}$/.test(a.inAt) && (a.status === 'Present' || a.status.startsWith('Late')))
    .map(a => {
      const late = a.status.startsWith('Late')
      return { ...a, today, late, delayMin: late ? Math.max(0, toMin(a.inAt) - toMin(SHIFT_START)) : 0, route: routeOf(a.initials) }
    })
    .sort((x, y) => toMin(y.inAt) - toMin(x.inAt))
}

const statusStyle: Record<string, string> = {
  Delayed: 'bg-t-severe/15 text-t-severe',
  'On time': 'bg-t-free/15 text-t-free',
  'At office': 'bg-teal/15 text-teal',
  'Not started': 'bg-surface-2 text-muted',
  Present: 'bg-t-free/15 text-t-free',
  'Late · excused': 'bg-teal/15 text-teal',
  'Late · not excused': 'bg-t-severe/15 text-t-severe',
  'WFH (rain)': 'bg-accent/15 text-accent',
  Absent: 'bg-surface-2 text-muted',
}

const tierColor: Record<BadgeTier, string> = { Gold: '#eab308', Silver: '#a3a3a3', Bronze: '#c2703d', None: 'var(--border)' }

function Avatar({ initials }: { initials: string }) {
  return <span className="grid place-items-center size-8 shrink-0 rounded-full bg-surface-2 text-[11px] font-bold">{initials}</span>
}

// Cause guesser ranking: the existing incident order, top 4

function CauseGuesser({ panel = false }: { panel?: boolean }) {
  const { data: incidents } = useIncidents()
  const rankedIncidents = incidents.slice(0, 4)
  return (
    <Card className={panel ? 'flex flex-col xl:h-[600px]' : ''} title={<span className="flex items-center gap-2"><Brain size={17} className="text-accent" /> Cause guesser</span>}
      action={panel && <span className="text-xs text-muted">problem · who is affected</span>}>
      <div className={`space-y-3 ${panel ? 'min-h-0 flex-1 overflow-y-auto pr-1' : ''}`}>
        {(panel ? incidents : rankedIncidents).map(i => {
          const hit = affectedBy(i.reason)
          return (
            <div key={i.id} className="rounded-xl p-2 -mx-2 hover:bg-surface-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="min-w-0 mr-auto">
                  <div className="text-sm font-semibold truncate">{i.place}</div>
                  <div className="text-xs text-muted">{isConfirmed(i.verification) ? 'Confirmed' : 'Likely'} <b className="text-ink">{i.reason.toLowerCase()}</b> · {i.reports} reports</div>
                </div>
                <Confidence value={i.confidence} />
              </div>
              {panel && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <Users size={13} />{hit.length ? hit.map(e => <span key={e.initials} className="chip bg-surface-2 text-ink">{e.name}</span>) : 'No employees affected'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function IncidentCards() {
  const { data: incidents } = useIncidents()
  const slots = Array.from({ length: 4 }, (_, k) => incidents[k])
  return (
    <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {slots.map((i, k) => i ? (
        <div key={i.id} className="card p-4 transition-all hover:-translate-y-0.5 hover:border-accent">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-bold">{i.place}</div>
            <LevelChip level={i.level}>{levelLabel[i.level]}</LevelChip>
          </div>
          <div className="mt-1 text-xs text-muted">Problem: <b className="text-ink">{i.reason}</b> · {i.id}</div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div><div className="text-2xl font-extrabold leading-none">{affectedBy(i.reason).length}</div><div className="text-[11px] text-muted mt-1">employees affected</div></div>
            <span className={`chip ${isConfirmed(i.verification) ? 'bg-t-free/15 text-t-free' : 'bg-t-moderate/15 text-t-moderate'}`}>{isConfirmed(i.verification) ? 'Confirmed' : `Predicted · L${i.verification}`}</span>
          </div>
        </div>
      ) : <div key={k} className="card p-4 grid place-items-center text-xs text-muted min-h-[120px]">No other active incident</div>)}
    </div>
  )
}

function Badges({ compact = false }: { compact?: boolean }) {
  const list = compact ? honesty.slice(0, 4) : honesty
  return (
    <Card title={<span className="flex items-center gap-2"><Award size={17} className="text-t-moderate" /> Honesty badges</span>}
      action={!compact && <span className="text-xs text-muted">+ points for verified reports · − for false claims</span>}>
      <ul className="space-y-2.5">
        {list.map((h, i) => (
          <li key={h.name} className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-surface-2 transition-colors">
            <span className="w-4 text-xs font-bold text-muted">{i + 1}</span>
            <span className="grid place-items-center size-9 shrink-0 rounded-full border-[3px]" style={{ borderColor: tierColor[h.tier] }}>
              <Medal size={16} style={{ color: h.tier === 'None' ? 'var(--muted)' : tierColor[h.tier] }} />
            </span>
            <div className="min-w-0 mr-auto">
              <div className="text-sm font-semibold">{h.name} <span className="text-xs text-muted font-medium">· {h.tier === 'None' ? 'no badge' : `${h.tier} badge`}</span></div>
              {!compact && <div className="text-xs text-muted">{h.note} · {h.streak}-day honest streak</div>}
            </div>
            <span className="text-sm font-extrabold">{h.points}</span>
            <span className={`chip ${h.change > 0 ? 'bg-t-free/15 text-t-free' : h.change < 0 ? 'bg-t-severe/15 text-t-severe' : 'bg-surface-2 text-muted'}`}>
              {h.change > 0 ? <TrendingUp size={12} /> : h.change < 0 ? <TrendingDown size={12} /> : null}{h.change > 0 ? `+${h.change}` : h.change}
            </span>
          </li>
        ))}
      </ul>
      {!compact && (
        <div className="mt-4 grid sm:grid-cols-3 gap-2.5 text-xs">
          {[['Gold', '800+ pts', 'Priority WFH on rain days'], ['Silver', '500+ pts', 'Late claims auto-approved'], ['Bronze', '300+ pts', 'Verified reporter tag']].map(([t, p, perk]) => (
            <div key={t} className="rounded-xl bg-surface-2 p-3"><b style={{ color: tierColor[t as BadgeTier] }}>{t}</b> · {p}<div className="text-muted mt-0.5">{perk}</div></div>
          ))}
        </div>
      )}
    </Card>
  )
}

function AttendanceTable() {
  const counts = attendance.reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {})
  return (
    <Card title={<span className="flex items-center gap-2"><CalendarCheck size={17} className="text-accent" /> Auto attendance · today</span>}
      action={<span className="text-xs text-muted">marked by office geofence, no punching in</span>}>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(counts).map(([k, v]) => <span key={k} className={`chip ${statusStyle[k]}`}>{v} {k}</span>)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">Employee</th><th className="font-semibold">In at</th><th className="font-semibold">Marked by</th><th className="font-semibold">Status</th><th className="font-semibold">Why</th></tr></thead>
          <tbody>
            {attendance.map(a => (
              <tr key={a.name} className="border-t border-line hover:bg-surface-2 transition-colors">
                <td className="py-3 pr-3"><span className="flex items-center gap-2.5 font-semibold"><Avatar initials={a.initials} />{a.name}</span></td>
                <td className="pr-3 font-semibold">{a.inAt}</td>
                <td className="pr-3 text-muted">{a.source}</td>
                <td className="pr-3"><span className={`chip whitespace-nowrap ${statusStyle[a.status]}`}>{a.status}</span></td>
                <td className="text-muted">{a.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function FairLateness() {
  return (
    <Card title={<span className="flex items-center gap-2"><Scale size={17} className="text-teal" /> Fair lateness · last 30 days</span>}
      action={<span className="text-xs text-muted">minutes late, split by verified cause</span>}>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={fairLateness} margin={{ left: -20 }} barSize={26}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="excused" stackId="a" name="Excused (road issue verified)" fill="#2bb3a3" radius={[0, 0, 6, 6]} />
            <Bar dataKey="notExcused" stackId="a" name="Not excused" fill="#ff6b1a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid sm:grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Late minutes excused</div><div className="text-xl font-extrabold">79%</div></div>
        <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Unfair penalties avoided</div><div className="text-xl font-extrabold">11</div></div>
        <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Needs a conversation</div><div className="text-xl font-extrabold">Priya</div></div>
      </div>
      <p className="mt-3 text-xs text-muted">Late is only counted against someone when no verified road issue, rain alert or company transport delay explains it.</p>
    </Card>
  )
}

function PrivacyPanel() {
  const [policies, setPolicies] = useState({ 'Work hours (8:00–18:00)': true, 'Official travel': true, 'Commute window (8:00–9:30)': true, 'Only after journey start': true, 'Company transport': false, 'Emergency (SOS)': true })
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title={<span className="flex items-center gap-2"><ShieldCheck size={17} className="text-t-free" /> Tracking policies</span>} action={<span className="chip bg-t-free/15 text-t-free">7 of 7 employees consented</span>}>
        <ul className="space-y-2">
          {Object.entries(policies).map(([k, on]) => (
            <li key={k} className="flex items-center justify-between rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm">
              {k}
              <button aria-pressed={on} onClick={() => setPolicies(p => ({ ...p, [k]: !on }))}
                className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer hover:ring-4 hover:ring-accent/20 ${on ? 'bg-accent' : 'bg-line'}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">No 24×7 tracking. Employees see a banner whenever tracking is on and can pause it outside these windows.</p>
      </Card>
      <Card title={<span className="flex items-center gap-2"><Lock size={17} className="text-accent" /> What the company can see</span>}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-t-free"><Eye size={14} /> Visible</div>
            {['Route status during commute', 'Delay minutes + verified cause', 'Arrival time (geofence)', 'Reports they submit'].map(x => <div key={x} className="mb-1.5 flex gap-2"><Check size={15} className="text-t-free shrink-0 mt-0.5" />{x}</div>)}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-t-severe"><EyeOff size={14} /> Never visible</div>
            {['Location outside policy windows', 'Personal trips & weekends', 'Exact home address', 'Contacts, photos, other apps'].map(x => <div key={x} className="mb-1.5 flex gap-2 text-muted"><EyeOff size={15} className="shrink-0 mt-0.5" />{x}</div>)}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-surface-2 p-3 text-xs text-muted">GPS traces are deleted after <b className="text-ink">30 days</b>. Only the delay summary is kept. Data shared with Gov is anonymised (no names).</div>
      </Card>
    </div>
  )
}

function SharedWithGov({ compact = false }: { compact?: boolean }) {
  const { data: incidents } = useIncidents()
  const [sending, setSending] = useState(false)
  // Proof = today's road problems at verification L4+ that delayed our employees
  const sendProof = async () => {
    const proofs = incidents.filter(i => i.verification >= 4 && affectedBy(i.reason).length)
    if (!proofs.length) return notify('No verified (L4+) delays to send right now.', false)
    if (!hasApi) return notify('No Authority Portal server configured (VITE_API_BASE_URL). Nothing was sent.', false)
    setSending(true)
    try {
      const ids: string[] = []
      for (const i of proofs) {
        const hit = affectedBy(i.reason)
        const r = await api<{ id: string; status: string }>('/company-reports', { method: 'POST', json: { company: 'Infinite Tech Pvt Ltd', place: i.place, reason: i.reason, employees: hit.length, delayMin: Math.max(...hit.map(e => e.delayMin)), evidence: ['GPS', `Verification L${i.verification}`] } })
        ids.push(`${r.id} (${r.status})`)
      }
      notify(`Received by the Authority Portal: ${ids.join(', ')}`)
    } catch (e) { notify((e as Error).message, false) } finally { setSending(false) }
  }
  const st = (s: string) => (s.startsWith('Referred') ? 'bg-teal/15 text-teal' : s === 'Verified' ? 'bg-t-free/15 text-t-free' : 'bg-surface-2 text-muted')
  const list = compact ? sharedWithGov.slice(0, 3) : sharedWithGov
  return (
    <Card title={<span className="flex items-center gap-2"><Landmark size={17} className="text-olive" /> Shared with Government</span>}
      action={<button className="btn !py-1.5 text-xs" disabled={sending} onClick={sendProof}><Send size={13} /> {sending ? 'Sending…' : 'Send proof now'}</button>}>
      {!compact && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {['Employee reports + GPS', 'Company verifies delay', 'Proof sent to Authority Portal', 'Gov refers to agency'].map((s, i) => (
            <span key={s} className="flex items-center gap-2"><span className="chip bg-accent-soft text-accent">{i + 1}. {s}</span>{i < 3 && <span className="text-muted">→</span>}</span>
          ))}
        </div>
      )}
      <div className="space-y-2.5">
        {list.map(r => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-line p-3 transition-all hover:border-accent hover:-translate-y-0.5">
            <div className="mr-auto min-w-0">
              <div className="text-sm font-bold">{r.place} · {r.reason}</div>
              <div className="text-xs text-muted">{r.id} · {r.employees} employees · +{r.delayMin} min · {r.proof}</div>
            </div>
            <span className={`chip ${st(r.govStatus)}`}>{r.govStatus}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">Proven delays go to the Authority Portal as anonymised evidence. Status updates come back here automatically.</p>
    </Card>
  )
}

function LateChart({ summary = true }: { summary?: boolean }) {
  const [days, setDays] = useState(7)
  const data = lateArrivals.slice(-days)
  return (
    <Card title="Late Arrivals" action={
      <select className="input !w-auto !py-1.5 !px-3 !rounded-full text-xs font-semibold cursor-pointer" value={days} onChange={e => setDays(Number(e.target.value))} aria-label="Time period">
        <option value={7}>Last 7 days</option>
        <option value={3}>Last 3 days</option>
      </select>}>
      <div className="h-52">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: -25, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="late" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Late arrivals" />
            <Line type="monotone" dataKey="justified" stroke="#9aa23a" strokeWidth={2.5} dot={{ r: 3 }} name="Auto-justified" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {summary && (() => {
        const late = data.reduce((a, d) => a + d.late, 0), just = data.reduce((a, d) => a + d.justified, 0)
        return (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Late arrivals</div><div className="text-xl font-extrabold">{late}</div></div>
            <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Justified by evidence</div><div className="text-xl font-extrabold">{late ? Math.round((just / late) * 100) : 0}%</div></div>
          </div>
        )
      })()}
    </Card>
  )
}

function RegularlyLate() {
  const rows = fairLateness
    .filter(f => f.lateDays >= REGULAR_LATE_MIN_DAYS)
    .map(f => ({ ...f, pct: Math.round((f.lateDays / WORKDAYS_30) * 100), avgMin: Math.round((f.excused + f.notExcused) / f.lateDays) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)
  return (
    <Card title="Regularly Late Employees" action={<span className="text-xs text-muted">last 30 days</span>}>
      {rows.length === 0 ? <p className="text-sm text-muted">No one has been late {REGULAR_LATE_MIN_DAYS}+ times this month.</p> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">Employee</th><th className="font-semibold text-right">Late days %</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} className="border-t border-line hover:bg-surface-2 transition-colors">
                <td className="py-2.5 pr-3"><span className="font-semibold">{i + 1}. {r.name}</span><span className="block text-xs text-muted">{r.lateDays} of {WORKDAYS_30} days · avg {r.avgMin} min late</span></td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-2 font-bold">
                    <span className="hidden sm:block h-1.5 w-16 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, r.pct * 3)}%` }} /></span>
                    {r.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-[11px] text-muted">Listed when late on {REGULAR_LATE_MIN_DAYS} or more working days in the last 30 days.</p>
    </Card>
  )
}

function ArrivalStatus({ onViewAll }: { onViewAll: () => void }) {
  const rows = todaysArrivals().slice(0, 6)
  return (
    <Card title="Today's Employee Arrival Status" action={<button className="btn !py-1.5 text-xs" onClick={onViewAll}>View all <ArrowRight size={13} /></button>}>
      {rows.length === 0 ? <p className="text-sm text-muted">No arrivals recorded yet today.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">Employee Name</th><th className="font-semibold">Status</th><th className="font-semibold">Route</th><th className="font-semibold">Date / Time</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name} className="border-t border-line hover:bg-surface-2 transition-colors">
                  <td className="py-2.5 pr-3"><span className="flex items-center gap-2.5 font-semibold"><Avatar initials={r.initials} />{r.name}</span></td>
                  <td className="pr-3"><span className={`chip whitespace-nowrap ${r.late ? 'bg-t-severe/15 text-t-severe' : 'bg-t-free/15 text-t-free'}`}>{r.late ? `Delayed · +${r.delayMin} min` : 'On time'}</span></td>
                  <td className="pr-3 text-muted">{r.route ?? '—'}</td>
                  <td className="whitespace-nowrap font-semibold">{r.today}, {r.inAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function ArrivalSummary() {
  const rows = todaysArrivals()
  const late = rows.filter(r => r.late)
  const avg = late.length ? Math.round(late.reduce((a, r) => a + r.delayMin, 0) / late.length) : 0
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5">
      <StatTile label="On Time" value={rows.length - late.length} color="#22a447" />
      <StatTile label="Delayed" value={late.length} color="#ef4444" />
      <StatTile label="Average Delay" value={avg} unit="min" color="#ff6b1a" />
    </div>
  )
}

// Demo only: hardcoded forecast standing in for a trained model
const forecast = [
  { route: 'Pumpwell flyover', people: 4, delay: 18 },
  { route: 'Thokkotu junction', people: 2, delay: 11 },
  { route: 'Nanthoor circle', people: 1, delay: 8 },
]

function LatenessForecast() {
  const total = forecast.reduce((a, f) => a + f.people, 0)
  return (
    <Card title={<span className="flex items-center gap-2"><Sparkles size={17} className="text-accent" /> Tomorrow's lateness forecast</span>}
      action={<span className="chip bg-accent-soft text-accent">AI estimate · demo</span>}>
      <p className="text-sm"><b>{total} employees</b> likely late, 8:40–9:30. Rain forecast + usual Friday jam.</p>
      <div className="mt-3 space-y-2">
        {forecast.map(f => (
          <div key={f.route} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
            <span className="mr-auto font-semibold">{f.route}</span>
            <span className="text-muted">{f.people} {f.people > 1 ? 'people' : 'person'}</span>
            <span className="chip bg-accent-soft text-accent">+{f.delay} min</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm">
        <span className="mr-auto">Suggest flexible start <b>9:30</b> for 4 people on the Pumpwell route.</span>
        <button className="btn btn-primary !py-1.5 text-xs" onClick={() => notify('Flexible 9:30 start suggested to 4 employees (demo).')}>Suggest</button>
      </div>
    </Card>
  )
}

function ProactiveAlerts({ onGov }: { onGov: () => void }) {
  const late = employees.filter(e => e.status === 'Delayed')
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <BellRing size={17} className="text-accent" />
        <b className="text-sm mr-auto">{late.length} employees will be late. We told you before they had to.</b>
        <button className="btn !py-1.5 text-xs" onClick={onGov}><Send size={13} /> Auto-complaint to Gov</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <StatTile label="Present" value={3} color="#22a447" />
        <StatTile label="Late · excused" value={2} color="#2bb3a3" />
        <StatTile label="Late · not excused" value={1} color="#ff6b1a" />
        <StatTile label="WFH (rain)" value={1} color="#9aa23a" />
        <StatTile label="Proofs sent to Gov" value={sharedWithGov.length} color="#eab308" />
      </div>
    </div>
  )
}

export default function CompanyDashboard() {
  const theme = useThemeMode('company', 'dark')
  const [params, setParams] = useSearchParams()
  const { data: liveIncidents } = useIncidents()
  const view = nav.some(n => n.id === params.get('view')) ? params.get('view')! : 'overview'
  const go = (id: string) => setParams(id === 'overview' ? {} : { view: id })
  const [report, setReport] = useState(reportTabs[0])
  const delayed = useMemo(() => employees.filter(e => e.status === 'Delayed').length, [])

  return (
    <CompanyShell nav={nav} active={view} onNav={go} onSearch={q => setParams(q ? { view: 'status', q } : { view: 'status' })} theme={theme} company="Infinite Tech Pvt Ltd"
      user={{ initials: 'MS', name: 'Mohammed Safaf, HR manager' }}>
      {view === 'overview' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] items-start">
          <div className="space-y-5 min-w-0">
            <LateChart summary={false} />
            <RegularlyLate />
          </div>
          <div className="space-y-5 min-w-0">
            <ArrivalStatus onViewAll={() => go('status')} />
            <ArrivalSummary />
            <LatenessForecast />
          </div>
        </div>
      )}
      {view === 'map' && (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,70fr)_minmax(0,30fr)] items-start">
            <div className="card p-3 min-w-0">
              <div className="flex items-center justify-between px-2 pb-3">
                <h3 className="text-[15px] font-bold">Live employee map</h3>
                <span className="text-xs text-muted flex items-center gap-1.5"><span className="size-2 rounded-full bg-t-free animate-pulse" /> Live · {delayed} delayed</span>
              </div>
              <TrafficMap className="h-[420px] sm:h-[540px]" showEmployees showIncidents={liveIncidents} showRoute />
            </div>
            <CauseGuesser panel />
          </div>
          <IncidentCards />
          <ProactiveAlerts onGov={() => { setReport('Shared with Gov'); go('reports') }} />
        </div>
      )}
      {view === 'weather' && (
        <WeatherPage />
      )}
      {view === 'status' && <div className="space-y-5"><EmployeeStatusPage /><AttendanceTable /></div>}
      {view === 'reports' && (
        <ReportsPage extra={
          <div className="space-y-5 border-t border-line pt-5">
            <h3 className="text-[15px] font-bold">Other company reports</h3>
            <div className="flex flex-wrap gap-1.5">
            {reportTabs.map(t => <button key={t} onClick={() => setReport(t)} className={`btn !py-2 !px-3.5 text-[13px] ${report === t ? 'pill-active' : '!bg-surface-2'}`}>{t}</button>)}
          </div>
          {report === 'Shared with Gov' && <div className="grid gap-5 xl:grid-cols-[1fr_420px]"><SharedWithGov /><div className="card p-3"><TrafficMap className="h-[460px]" showIncidents showHotspots /></div></div>}
          {report === 'Fair lateness' && <div className="grid gap-5 xl:grid-cols-[1fr_380px] items-start"><FairLateness /><div className="space-y-5"><LateChart /><CauseGuesser /></div></div>}
          {report === 'Badges' && <div className="grid gap-5 xl:grid-cols-[1fr_380px]"><Badges /><CauseGuesser /></div>}
          {report === 'Privacy' && <PrivacyPanel />}
        </div>} />
      )}
    </CompanyShell>
  )
}
