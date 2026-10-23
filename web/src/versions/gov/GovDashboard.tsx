import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, Building2, Check, Copy, Download, FileText, Info, Lightbulb, Map as MapIcon, MapPin, Radio, Repeat, ShieldCheck } from 'lucide-react'
import ControlShell from '../../components/ControlShell'
import TrafficMap from '../../components/TrafficMap'
import { useThemeMode } from '../../components/theme'
import { Card, Confidence, LevelChip, StatTile, VerifyDots, tooltipStyle } from '../../components/ui'

import {
  companyReports, hotspots, hoursLost, incidents, monthlyByReason, referralStages, referrals, roadOwnership,
  thokkotuEvidence, verificationSteps, type CompanyReport,
} from '../../data/mock'

const tabs = ['Overview', 'Company reports', 'Hotspots', 'Road ownership', 'Reports']

function IncidentFeed() {
  const [open, setOpen] = useState(incidents[0].id)
  return (
    <Card title={<span className="flex items-center gap-2"><Radio size={16} className="text-t-severe animate-pulse" /> Live incident feed</span>} action={<span className="text-xs text-muted">{incidents.length} active</span>}>
      <div className="space-y-2.5">
        {incidents.map(i => (
          <button key={i.id} onClick={() => setOpen(i.id)}
            className={`w-full text-left rounded-2xl border p-3 transition-all cursor-pointer hover:border-accent hover:-translate-y-0.5 ${open === i.id ? 'border-accent bg-accent-soft' : 'border-line'}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm mr-auto">{i.reason}</span>
              <LevelChip level={i.level}>{i.level === 'closed' ? 'Closed' : `+${i.delayMin} min`}</LevelChip>
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1"><MapPin size={12} /> {i.place} · {i.since} · {i.id}</div>
            <div className="mt-2 flex items-center justify-between"><VerifyDots level={i.verification} /><Confidence value={i.confidence} /></div>
            {open === i.id && (
              <ol className="mt-3 grid grid-cols-3 gap-1.5 text-[10.5px]">
                {verificationSteps.map((s, n) => (
                  <li key={s} className={`rounded-lg px-2 py-1.5 font-semibold ${n < i.verification ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>{n + 1}. {s}</li>
                ))}
              </ol>
            )}
          </button>
        ))}
      </div>
    </Card>
  )
}

function HotspotList() {
  return (
    <Card title={<span className="flex items-center gap-2"><Repeat size={16} className="text-accent" /> Recurring hotspots</span>} action={<span className="text-xs text-muted">last 30 working days</span>}>
      <div className="space-y-3">
        {hotspots.map(h => (
          <div key={h.place} className="rounded-2xl border border-line p-3.5 transition-all hover:border-accent hover:-translate-y-0.5">
            <div className="flex items-center gap-2">
              <b className="text-sm mr-auto">{h.place}</b>
              <span className="chip bg-t-severe/15 text-t-severe">{h.days} of 30 days</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-t-moderate via-t-heavy to-t-severe" style={{ width: `${(h.days / 30) * 100}%` }} /></div>
            <div className="mt-2 text-xs text-muted">Main cause <b className="text-ink">{h.mainCause}</b> · {h.hoursLost.toLocaleString()} commuter-hours lost</div>
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-surface-2 p-2.5 text-xs"><Lightbulb size={14} className="text-accent shrink-0 mt-0.5" /><span><b>Suggested fix:</b> {h.suggestion}</span></div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ReasonChart() {
  return (
    <Card title="Incidents by reason" action={<span className="text-xs text-muted">May–Oct</span>}>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={monthlyByReason} margin={{ left: -25 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="accident" name="Accident" fill="#ff6b1a" radius={[6, 6, 0, 0]} />
            <Bar dataKey="rain" name="Rain / flood" fill="#2bb3a3" radius={[6, 6, 0, 0]} />
            <Bar dataKey="repair" name="Road repair" fill="#9aa23a" radius={[6, 6, 0, 0]} />
            <Bar dataKey="other" name="Other" fill="#eab308" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function HoursChart() {
  return (
    <Card title="Commuter-hours lost today" action={<span className="text-2xl font-extrabold">2,770 <span className="text-xs text-muted font-semibold">hrs</span></span>}>
      <div className="h-40">
        <ResponsiveContainer>
          <BarChart data={hoursLost} margin={{ left: -25 }}>
            <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis hide />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="v" name="Hours" radius={[6, 6, 6, 6]} barSize={16}>
              {hoursLost.map(d => <Cell key={d.h} fill={d.v >= 300 ? 'var(--accent)' : '#9aa23a'} fillOpacity={d.v >= 300 ? 1 : 0.55} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">Peaks at 8–9 am and 5–7 pm, mostly on NH-66.</p>
    </Card>
  )
}

function ReportExports() {
  return (
    <Card title={<span className="flex items-center gap-2"><FileText size={16} className="text-accent" /> Evidence reports</span>}>
      <div className="grid sm:grid-cols-3 gap-3">
        {[['Monthly', 'Oct 2026', '214 incidents'], ['Quarterly', 'Q3 2026', '688 incidents'], ['Annual', '2025–26', '2,431 incidents']].map(([k, p, n]) => (
          <div key={k} className="rounded-2xl bg-surface-2 p-4">
            <div className="text-xs text-muted font-semibold">{k}</div>
            <div className="font-extrabold text-lg">{p}</div>
            <div className="text-xs text-muted">{n}</div>
            <button className="btn mt-3 w-full !py-1.5 text-xs"><Download size={13} /> PDF</button>
          </div>
        ))}
      </div>
    </Card>
  )
}

const reportStyle: Record<CompanyReport['status'], string> = {
  New: 'bg-accent/15 text-accent',
  'Possible duplicate': 'bg-t-moderate/15 text-t-moderate',
  Verified: 'bg-t-free/15 text-t-free',
  Referred: 'bg-teal/15 text-teal',
}

function CompanyReports({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState(companyReports)
  const set = (id: string, status: CompanyReport['status']) => setRows(r => r.map(x => (x.id === id ? { ...x, status } : x)))
  const merge = (lead: string) => setRows(r => r.filter(x => x.groupWith !== lead).map(x => (x.id === lead ? { ...x, status: 'Verified', employees: x.employees + 7, evidence: [...x.evidence, 'Video'] } : x)))
  const dupes = rows.filter(r => r.status === 'Possible duplicate')
  const list = compact ? rows.slice(0, 4) : rows
  return (
    <Card title={<span className="flex items-center gap-2"><Building2 size={16} className="text-accent" /> Reports from companies</span>}
      action={<span className="text-xs text-muted">{rows.length} today</span>}>
      {dupes.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-t-moderate/40 bg-t-moderate/10 p-3 text-sm">
          <Copy size={16} className="text-t-moderate" />
          <span className="mr-auto"><b>{dupes.length + 1} reports</b> look like the same incident at Thokkotu junction.</span>
          <button className="btn !py-1.5 text-xs" onClick={() => merge(dupes[0].groupWith!)}>Merge into {dupes[0].groupWith}</button>
        </div>
      )}
      <div className="space-y-2.5">
        {list.map(r => (
          <div key={r.id} className={`rounded-2xl border p-3 transition-all hover:border-accent hover:-translate-y-0.5 ${r.status === 'Possible duplicate' ? 'border-dashed border-t-moderate/50' : 'border-line'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-sm mr-auto">{r.place} · {r.reason}</b>
              <span className={`chip ${reportStyle[r.status]}`}>{r.status}{r.groupWith ? ` of ${r.groupWith}` : ''}</span>
            </div>
            <div className="text-xs text-muted mt-1">{r.company} · {r.employees} employees · +{r.delayMin} min · {r.at} · {r.id}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {r.evidence.map(e => <span key={e} className="chip bg-surface-2 text-ink">{e}</span>)}
              {!compact && r.status === 'New' && (
                <span className="ml-auto flex gap-1.5">
                  <button className="btn !py-1 text-xs" onClick={() => set(r.id, 'Verified')}><Check size={13} /> Verify</button>
                  <button className="btn !py-1 text-xs" onClick={() => set(r.id, 'Referred')}><ArrowUpRight size={13} /> Refer</button>
                </span>
              )}
              {!compact && r.status === 'Verified' && (
                <button className="btn !py-1 text-xs ml-auto" onClick={() => set(r.id, 'Referred')}><ArrowUpRight size={13} /> Refer to agency</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ReferralTracking() {
  return (
    <Card title={<span className="flex items-center gap-2"><ArrowUpRight size={16} className="text-accent" /> Referral tracking</span>} action={<button className="btn !py-1.5 text-xs">New referral</button>}>
      <div className="space-y-3">
        {referrals.map(r => (
          <div key={r.id} className="rounded-2xl border border-line p-3.5 transition-all hover:border-accent">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-sm mr-auto">{r.issue}</b>
              <span className="text-xs text-muted">{r.id} · sent {r.sent}</span>
            </div>
            <div className="text-xs text-muted mt-1">{r.segment} → <b className="text-ink">{r.agency}</b> · {r.reports} reports attached</div>
            <ol className="mt-3 grid grid-cols-4 gap-1.5">
              {referralStages.map((st, i) => (
                <li key={st} className="text-[10.5px] font-semibold">
                  <div className={`h-1.5 rounded-full ${i <= r.stage ? 'bg-accent' : 'bg-surface-2'}`} />
                  <div className={`mt-1 ${i <= r.stage ? 'text-ink' : 'text-muted'}`}>{st}</div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Card>
  )
}

function RoadOwnership() {
  return (
    <Card title={<span className="flex items-center gap-2"><MapIcon size={16} className="text-teal" /> Road ownership</span>} action={<span className="text-xs text-muted">segment → responsible agency</span>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-2 font-semibold">Road segment</th><th className="font-semibold">Type</th><th className="font-semibold">Responsible agency</th><th className="font-semibold">Mapping</th><th className="font-semibold">Open referrals</th></tr></thead>
          <tbody>
            {roadOwnership.map(r => (
              <tr key={r.segment} className="border-t border-line hover:bg-surface-2 transition-colors">
                <td className="py-3 pr-3 font-semibold">{r.segment}</td>
                <td className="pr-3 text-muted">{r.type}</td>
                <td className="pr-3">{r.agency}</td>
                <td className="pr-3">{r.verified ? <span className="chip bg-t-free/15 text-t-free">Verified</span> : <button className="btn !py-1 text-xs">Confirm owner</button>}</td>
                <td>{r.open}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function EvidenceReport() {
  const [made, setMade] = useState(false)
  const e = thokkotuEvidence
  return (
    <Card title={<span className="flex items-center gap-2"><FileText size={16} className="text-accent" /> Evidence report · {e.place}</span>}
      action={<span className="chip bg-t-severe/15 text-t-severe">{e.days} of 30 days</span>}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[['Companies', e.companies], ['Reports', e.reports], ['Employees hit', e.employeesAffected], ['Avg delay', `${e.avgDelay} min`]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface-2 p-3"><div className="text-[11px] text-muted font-semibold">{k}</div><div className="text-lg font-extrabold">{v}</div></div>
        ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-muted">
        <li>• {e.hoursLost} commuter-hours lost in 30 days</li>
        <li>• {e.mapsSpeed}</li>
        <li>• Responsible agency: <b className="text-ink">{e.responsible}</b> (verified road ownership)</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => setMade(true)}><FileText size={15} /> {made ? 'Report ready' : 'Generate evidence report'}</button>
        {made && <button className="btn"><Download size={15} /> Download PDF</button>}
        {made && <button className="btn"><ArrowUpRight size={15} /> Refer to {e.responsible}</button>}
      </div>
      <p className="mt-3 text-[11px] text-muted">Supports a traffic engineering investigation. It is not a final finding.</p>
    </Card>
  )
}

export default function GovDashboard() {
  const theme = useThemeMode('gov', 'dark')
  const [tab, setTab] = useState('Overview')

  const tiles = (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
      <StatTile label="Company reports today" value={companyReports.length} color="#ff6b1a" />
      <StatTile label="Duplicates found" value={2} color="#9aa23a" />
      <StatTile label="Hours lost today" value="2.7k" color="#eab308" />
      <StatTile label="Recurring hotspots" value={hotspots.length} color="#2bb3a3" />
      <StatTile label="Referrals open" value={referrals.filter(r => r.stage < 3).length} color="#22a447" />
    </div>
  )

  return (
    <ControlShell sub="Authority Portal · Mangaluru" tabs={tabs} active={tab} onTab={setTab} theme={theme}
      user={{ initials: 'TP', name: 'Traffic Police Control Room' }}
      cta={<span className="btn !bg-olive !border-olive !text-white hidden sm:inline-flex"><ShieldCheck size={15} /> Authorised officer</span>}>
      {tab === 'Overview' && (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <div className="space-y-5"><CompanyReports compact /><IncidentFeed /></div>
          <div className="space-y-5 min-w-0">
            <div className="card relative p-3">
              <div className="flex items-center justify-between px-2 pb-3">
                <h3 className="text-[15px] font-bold">City traffic · Mangaluru</h3>
                <span className="text-xs text-muted flex items-center gap-1.5"><span className="size-2 rounded-full bg-t-free animate-pulse" /> Live · Google Maps inputs</span>
              </div>
              <TrafficMap className="h-[460px]" showIncidents showHotspots />
            </div>
            {tiles}
            <div className="grid gap-5 lg:grid-cols-2"><EvidenceReport /><ReferralTracking /></div>
          </div>
        </div>
      )}
      {tab === 'Company reports' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_420px]"><CompanyReports /><IncidentFeed /></div>
      )}
      {tab === 'Hotspots' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
          <div className="space-y-5 min-w-0">
            <div className="card p-3"><TrafficMap className="h-[480px]" showHotspots showIncidents={false} /></div>
            <EvidenceReport />
          </div>
          <HotspotList />
        </div>
      )}
      {tab === 'Road ownership' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_440px]"><RoadOwnership /><ReferralTracking /></div>
      )}
      {tab === 'Reports' && (
        <div className="space-y-5">
          {tiles}
          <div className="grid gap-5 lg:grid-cols-2"><ReasonChart /><HoursChart /></div>
          <ReportExports />
        </div>
      )}
      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-muted">
        <Info size={13} /> TrafficSense assists with evidence and coordination. Final verification, engineering judgements and official actions remain with authorised officials.
      </p>
    </ControlShell>
  )
}
