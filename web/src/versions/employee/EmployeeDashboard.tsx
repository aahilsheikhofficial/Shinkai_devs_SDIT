import { useState } from 'react'
import { downloadFile, sendReport, useIncidents } from '../../data/api'
import { notify } from '../../components/toast'
import NotificationsBell from '../../components/NotificationsBell'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle, Bell, Camera, CarFront, CloudRain, Construction, FileCheck2, History, LayoutGrid,
  LogOut, MapPin, Navigation, Route, Search, Settings, ShieldCheck, TrafficCone, Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import TrafficMap from '../../components/TrafficMap'
import { ThemeToggle, useThemeMode } from '../../components/theme'
import { Card, Confidence, LevelChip, VerifyDots, tooltipStyle } from '../../components/ui'
import { delayCauses, weekCommute } from '../../data/mock'
import WeatherChip, { RainWarning } from '../../components/WeatherChip'

// Each item scrolls to its section on this page
const nav = [
  { label: 'Dashboard', icon: LayoutGrid, to: 'top' },
  { label: 'My commute', icon: Route, to: 'commute' },
  { label: 'Alerts', icon: Bell, badge: 3, to: 'alerts' },
  { label: 'Report', icon: Camera, to: 'alerts' },
  { label: 'Late log', icon: History, to: 'late-log' },
  { label: 'Privacy', icon: ShieldCheck, to: 'tracking' },
  { label: 'Settings', icon: Settings, to: 'tracking' },
]

const quickReports = [
  { label: 'Accident', icon: CarFront },
  { label: 'Road repair', icon: Construction },
  { label: 'Heavy rain', icon: CloudRain },
  { label: 'Signal down', icon: TrafficCone },
]

const lateLog = [
  { date: 'Today', delay: 32, reason: 'Accident at Pumpwell', evidence: 'GPS stayed in zone 08:12–08:47', ok: true },
  { date: 'Wed 21', delay: 22, reason: 'Heavy rain, Thokkotu', evidence: '6 nearby reports + weather data', ok: true },
  { date: 'Mon 12', delay: 9, reason: 'No incident found', evidence: 'Route was clear', ok: false },
]

export default function EmployeeDashboard() {
  const theme = useThemeMode('employee', 'light')
  const [active, setActive] = useState('Dashboard')
  const [tracking, setTracking] = useState(true)
  const [reported, setReported] = useState<string | null>(null)
  const [avoid, setAvoid] = useState(false)
  const [q, setQ] = useState('')
  const { data: incidents } = useIncidents()
  const myRoute = incidents.filter(i => ['INC-2041', 'INC-2042'].includes(i.id) && (!q.trim() || `${i.place} ${i.reason}`.toLowerCase().includes(q.trim().toLowerCase())))
  const go = (label: string, to: string) => { setActive(label); document.getElementById(to)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const report = async (label: string) => {
    setReported(null)
    try {
      const r = await sendReport(label === 'Heavy rain' ? 'Heavy rain' : label === 'Signal down' ? 'Signal failure' : label, { reporter: 'AS' })
      setReported(`${label} (${r.incident.id}, verification L${r.incident.verification})`)
    } catch (e) { notify((e as Error).message, false) }
  }
  const exportLog = () => downloadFile('late-arrival-log-aahil.csv',
    ['Date,Delay (min),Reason,Evidence,Status', ...lateLog.map(r => [r.date, r.delay, r.reason, r.evidence, r.ok ? 'Auto-justified' : 'Needs note'].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n'), 'text/csv')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (Extej style) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 border-r border-line bg-surface px-4 py-6 sticky top-0 h-screen">
        <div className="px-2 mb-6"><Logo sub="Employee" /></div>
        {nav.map(n => {
          const on = active === n.label
          return (
            <button key={n.label} onClick={() => go(n.label, n.to)}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
                ${on ? 'bg-accent text-white shadow-[0_6px_16px_-6px_var(--accent)]' : 'text-muted hover:bg-surface-2 hover:text-ink hover:translate-x-0.5'}`}>
              <n.icon size={18} /> {n.label}
              {n.badge && <span className={`ml-auto chip ${on ? 'bg-white/25 text-white' : 'bg-accent-soft text-accent'}`}>{n.badge}</span>}
            </button>
          )
        })}
        <div className="mt-auto rounded-2xl bg-accent-soft p-4">
          <div className="text-sm font-bold">Tracking is {tracking ? 'ON' : 'OFF'}</div>
          <p className="text-xs text-muted mt-1">Only during your commute window, 8:00–9:30. Your company never sees personal trips.</p>
        </div>
        <Link to="/" className="btn btn-ghost justify-start mt-2 text-muted"><LogOut size={16} /> Log out</Link>
      </aside>

      <main id="top" className="flex-1 min-w-0 p-5 lg:p-8 space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-extrabold tracking-tight">Good morning, Aahil 👋</h1>
            <p className="text-sm text-muted">Thursday, 23 Oct · Ullal → TechPark, Padil</p>
          </div>
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !rounded-full !pl-10 w-60" placeholder="Search a road or place" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go('Alerts', 'alerts') }} />
          </div>
          <span className="hidden lg:inline-flex"><WeatherChip /></span>
          <NotificationsBell size={17} dot="bg-accent" only={['INC-2041', 'INC-2042']} />
          <ThemeToggle {...theme} />
          <span className="grid place-items-center size-10 rounded-full bg-accent text-white font-bold text-sm">AS</span>
        </header>

        {/* Top row */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Card id="commute" className="xl:col-span-2" title="Today’s commute"
            action={<LevelChip level="severe">+32 min delay</LevelChip>}>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                ['ETA', '09:47', 'usually 09:15'],
                ['Distance', '18.4 km', 'via NH-66 / NH-73'],
                ['Main cause', 'Accident', 'Pumpwell flyover'],
                ['Confidence', '92%', 'verified, level 5'],
              ].map(([k, v, s]) => (
                <div key={k} className="rounded-2xl bg-surface-2 p-4 transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-muted font-semibold">{k}</div>
                  <div className="text-xl font-extrabold mt-1">{v}</div>
                  <div className="text-[11px] text-muted">{s}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4">
              <Zap className="text-accent" size={20} />
              <div className="mr-auto text-sm">
                <b>Faster route found:</b> take the bypass after Thokkotu and save <b>14 min</b>.
              </div>
              <button className="btn btn-primary" onClick={() => { setAvoid(a => !a); notify(avoid ? 'Back on your usual route.' : 'Live route now shows the bypass only.'); document.getElementById('live-route')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}><Navigation size={15} /> {avoid ? 'Avoiding (undo)' : 'Avoid this route'}</button>
            </div>
            <div className="mt-3"><RainWarning /></div>
          </Card>

          <Card id="tracking" title="Commute tracking" action={
            <button onClick={() => setTracking(t => !t)} aria-pressed={tracking}
              className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer hover:ring-4 hover:ring-accent/20 ${tracking ? 'bg-accent' : 'bg-surface-2 border border-line'}`}>
              <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${tracking ? 'left-6' : 'left-1'}`} />
            </button>
          }>
            <p className="text-sm text-muted">Shared with <b className="text-ink">Infinite Tech Pvt Ltd</b> only while this is on.</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {['Work hours 8:00–18:00', 'Official travel', 'Starts when you begin the journey', 'Emergency (SOS)'].map(p => (
                <li key={p} className="flex items-center gap-2"><ShieldCheck size={16} className="text-t-free" /> {p}</li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl bg-surface-2 p-3 text-xs text-muted">
              Your company is told <b className="text-ink">why</b> you’re late automatically, so you don’t have to explain.
            </div>
          </Card>
        </div>

        {/* Map + alerts */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Card id="live-route" className="xl:col-span-2 !p-3" >
            <div className="flex items-center justify-between px-2 pt-1 pb-3">
              <h3 className="text-[15px] font-bold">Live route</h3>
              <span className="text-xs text-muted flex items-center gap-1.5"><span className="size-2 rounded-full bg-t-free animate-pulse" /> Updated 30 s ago</span>
            </div>
            <TrafficMap className="h-[360px]" showRoute={!avoid} showAltRoute showIncidents={myRoute} />
          </Card>

          <Card id="alerts" title="Alerts on your route" action={<span className="chip bg-accent-soft text-accent">{myRoute.length} active</span>}>
            <div className="space-y-3">
              {myRoute.map(i => (
                <div key={i.id} className="rounded-2xl border border-line p-3.5 transition-all hover:border-accent hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-2"><AlertTriangle size={15} className="text-accent" />{i.reason}</span>
                    <LevelChip level={i.level}>+{i.delayMin} min</LevelChip>
                  </div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-1"><MapPin size={12} />{i.place} · since {i.since} · {i.reports} reports</div>
                  <div className="mt-2 flex items-center justify-between"><VerifyDots level={i.verification} /><Confidence value={i.confidence} /></div>
                </div>
              ))}
              <div className="pt-1">
                <div className="text-xs font-semibold text-muted mb-2">See something? Report in one tap</div>
                <div className="grid grid-cols-2 gap-2">
                  {quickReports.map(q => (
                    <button key={q.label} onClick={() => report(q.label)}
                      className={`btn !rounded-xl !justify-start ${reported?.startsWith(q.label) ? '!border-accent !bg-accent-soft' : ''}`}>
                      <q.icon size={15} className="text-accent" /> {q.label}
                    </button>
                  ))}
                </div>
                {reported && <p className="mt-2 text-xs text-t-free font-semibold">✓ {reported} reported with GPS + time. Thank you!</p>}
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2" title="Commute time this week" action={<span className="text-xs text-muted">minutes</span>}>
            <div className="h-60">
              <ResponsiveContainer>
                <AreaChart data={weekCommute} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="emp-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <Tooltip {...tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
                  <Area type="monotone" dataKey="usual" stroke="var(--muted)" strokeDasharray="4 4" fill="none" name="Usual" />
                  <Area type="monotone" dataKey="minutes" stroke="var(--accent)" strokeWidth={3} fill="url(#emp-area)" name="Actual" activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Why you were late (30 days)">
            <div className="relative h-44">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={delayCauses} dataKey="value" innerRadius={56} outerRadius={80} paddingAngle={3} cornerRadius={6} stroke="none">
                    {delayCauses.map(c => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center"><div className="text-2xl font-extrabold">3h 12m</div><div className="text-[11px] text-muted">time lost</div></div>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
              {delayCauses.map(c => <li key={c.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c.color }} />{c.name}<b className="ml-auto pr-2">{c.value}%</b></li>)}
            </ul>
          </Card>
        </div>

        <Card id="late-log" title="Late arrival log" action={<button className="btn" onClick={exportLog}><FileCheck2 size={15} /> Export</button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr><th className="py-2 font-semibold">Date</th><th className="font-semibold">Delay</th><th className="font-semibold">Reason</th><th className="font-semibold">Evidence</th><th className="font-semibold">Status</th></tr>
              </thead>
              <tbody>
                {lateLog.map(r => (
                  <tr key={r.date} className="border-t border-line hover:bg-surface-2 transition-colors">
                    <td className="py-3 font-semibold">{r.date}</td>
                    <td>+{r.delay} min</td>
                    <td>{r.reason}</td>
                    <td className="text-muted">{r.evidence}</td>
                    <td>{r.ok ? <span className="chip bg-t-free/15 text-t-free">Auto-justified</span> : <span className="chip bg-t-moderate/15 text-t-moderate">Needs note</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
