import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BellRing, Brain, CloudRain, Crown, Send, Star, Users } from 'lucide-react'
import ControlShell from '../../components/ControlShell'
import TrafficMap from '../../components/TrafficMap'
import { useThemeMode } from '../../components/theme'
import { Card, Confidence, StatTile, tooltipStyle } from '../../components/ui'
import { employees, incidents, lateArrivals, monsoonRisk, reporters } from '../../data/mock'

const tabs = ['Overview', 'Employees', 'Incidents', 'Reports']

const statusStyle: Record<string, string> = {
  Delayed: 'bg-t-severe/15 text-t-severe',
  'On time': 'bg-t-free/15 text-t-free',
  'At office': 'bg-teal/15 text-teal',
  'Not started': 'bg-surface-2 text-muted',
}

function EmployeeTable() {
  return (
    <Card title="Employee travel board" action={<span className="text-xs text-muted flex items-center gap-1.5"><Users size={14} /> {employees.length} employees</span>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr><th className="py-2 font-semibold">Employee</th><th className="font-semibold">Route</th><th className="font-semibold">Status</th><th className="font-semibold">Delay</th><th className="font-semibold">Reason</th><th className="font-semibold">Verified</th></tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.name} className="border-t border-line hover:bg-surface-2 transition-colors">
                <td className="py-3"><span className="flex items-center gap-2.5 font-semibold"><span className="grid place-items-center size-8 rounded-full bg-surface-2 text-[11px] font-bold">{e.initials}</span>{e.name}</span></td>
                <td className="text-muted">{e.route}</td>
                <td><span className={`chip ${statusStyle[e.status]}`}>{e.status}</span></td>
                <td className="font-semibold">{e.delayMin ? `+${e.delayMin} min` : '—'}</td>
                <td>{e.reason ?? '—'}</td>
                <td>{e.verified === undefined ? '—' : e.verified ? <span className="chip bg-t-free/15 text-t-free">GPS evidence</span> : <span className="chip bg-t-moderate/15 text-t-moderate">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function CauseGuesser() {
  return (
    <Card title={<span className="flex items-center gap-2"><Brain size={17} className="text-accent" /> Cause guesser</span>}>
      <div className="space-y-3">
        {incidents.slice(0, 4).map(i => (
          <div key={i.id} className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-surface-2 transition-colors">
            <div className="min-w-0 mr-auto">
              <div className="text-sm font-semibold truncate">{i.place}</div>
              <div className="text-xs text-muted">Likely <b className="text-ink">{i.reason.toLowerCase()}</b> · {i.reports} reports</div>
            </div>
            <Confidence value={i.confidence} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function Monsoon() {
  const c = (r: string) => (r === 'High' ? '#ef4444' : r === 'Medium' ? '#eab308' : '#22c55e')
  return (
    <Card title={<span className="flex items-center gap-2"><CloudRain size={17} className="text-teal" /> Monsoon risk</span>} action={<span className="text-xs text-muted">next 5 days</span>}>
      <div className="grid grid-cols-5 gap-2">
        {monsoonRisk.map(m => (
          <div key={m.day} className="rounded-xl bg-surface-2 p-2.5 text-center transition-transform hover:-translate-y-0.5">
            <div className="text-xs text-muted font-semibold">{m.day}</div>
            <div className="mt-2 mx-auto w-3 h-16 rounded-full bg-line flex items-end overflow-hidden"><div className="w-full rounded-full" style={{ height: `${m.rain}%`, background: c(m.risk) }} /></div>
            <div className="mt-2 text-xs font-bold" style={{ color: c(m.risk) }}>{m.risk}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Sun–Mon: suggest work-from-home for <b className="text-ink">Ullal & Thokkotu</b> commuters.</p>
    </Card>
  )
}

function TrustScores() {
  return (
    <Card title={<span className="flex items-center gap-2"><Star size={17} className="text-t-moderate" /> Reporter trust score</span>}>
      <ul className="space-y-2.5">
        {reporters.map(r => (
          <li key={r.name} className="flex items-center gap-3 text-sm">
            <span className="mr-auto font-semibold">{r.name}<span className="ml-2 text-xs text-muted font-normal">{r.reports} reports</span></span>
            <Confidence value={r.accuracy} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function LateChart() {
  return (
    <Card title="Late arrivals" action={<button className="btn !py-1.5 text-xs">Last 7 days</button>}>
      <div className="h-44">
        <ResponsiveContainer>
          <LineChart data={lateArrivals} margin={{ left: -25, right: 6, top: 5 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
            <Line type="monotone" dataKey="late" stroke="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Late" />
            <Line type="monotone" dataKey="justified" stroke="#9aa23a" strokeWidth={2.5} dot={false} name="Auto-justified" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Justified by evidence</div><div className="text-xl font-extrabold">81%</div></div>
        <div className="rounded-xl bg-surface-2 p-3"><div className="text-xs text-muted">Avg delay</div><div className="text-xl font-extrabold">17 <span className="text-xs font-semibold text-muted">min</span></div></div>
      </div>
    </Card>
  )
}

function ProactiveAlerts() {
  const late = employees.filter(e => e.status === 'Delayed')
  return (
    <div className="card p-4 sm:absolute sm:left-4 sm:right-4 sm:bottom-4 sm:!bg-surface/95 backdrop-blur mt-3 sm:mt-0">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <BellRing size={17} className="text-accent" />
        <b className="text-sm mr-auto">{late.length} employees will be late. We told you before they had to.</b>
        <button className="btn !py-1.5 text-xs"><Send size={13} /> Auto-complaint to Gov</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <StatTile label="Travelling" value={4} color="#ff6b1a" />
        <StatTile label="Delayed" value={late.length} color="#9aa23a" />
        <StatTile label="Avg delay" value={20} unit="min" color="#eab308" />
        <StatTile label="Verified incidents" value={3} color="#2bb3a3" />
        <StatTile label="On time today" value="71%" color="#22a447" />
      </div>
    </div>
  )
}

export default function CompanyDashboard() {
  const theme = useThemeMode('company', 'dark')
  const [tab, setTab] = useState('Overview')

  return (
    <ControlShell sub="Company" tabs={tabs} active={tab} onTab={setTab} theme={theme}
      user={{ initials: 'MS', name: 'Mohammed Safaf, HR manager' }}
      cta={<button className="btn !bg-olive !border-olive !text-white hidden sm:inline-flex"><Crown size={15} /> Infinite Tech</button>}>
      {tab === 'Overview' && (
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <div className="space-y-5">
            <LateChart />
            <Monsoon />
          </div>
          <div className="space-y-5 min-w-0">
            <div className="card relative p-3">
              <div className="flex items-center justify-between px-2 pb-3">
                <h3 className="text-[15px] font-bold">Live employee map</h3>
                <span className="text-xs text-muted flex items-center gap-1.5"><span className="size-2 rounded-full bg-t-free animate-pulse" /> Live</span>
              </div>
              <TrafficMap className="h-[560px]" showEmployees showRoute showLegend={false} />
              <ProactiveAlerts />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <CauseGuesser />
              <TrustScores />
            </div>
          </div>
        </div>
      )}
      {tab === 'Employees' && <EmployeeTable />}
      {tab === 'Incidents' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="card p-3"><TrafficMap className="h-[560px]" showIncidents /></div>
          <div className="space-y-5"><CauseGuesser /><TrustScores /></div>
        </div>
      )}
      {tab === 'Reports' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <LateChart />
          <Card title="Delay hours by department">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[{ d: 'Eng', h: 42 }, { d: 'Sales', h: 28 }, { d: 'Ops', h: 35 }, { d: 'HR', h: 9 }, { d: 'Finance', h: 14 }]} margin={{ left: -25 }}>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="h" fill="var(--accent)" radius={[8, 8, 8, 8]} barSize={28} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="lg:col-span-2"><EmployeeTable /></div>
        </div>
      )}
    </ControlShell>
  )
}
