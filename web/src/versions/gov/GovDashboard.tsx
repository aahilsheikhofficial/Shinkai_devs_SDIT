import { useState } from 'react'
import { api, dataChanged, hasApi, printAsPdf, useIncidents, useLive } from '../../data/api'
import { notify } from '../../components/toast'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, Building2, Check, Copy, Download, FileText, Info, Lightbulb, Map as MapIcon, MapPin, Radio, Repeat, ShieldCheck } from 'lucide-react'
import ControlShell from '../../components/ControlShell'
import TrafficMap from '../../components/TrafficMap'
import { useThemeMode } from '../../components/theme'
import { useWeather } from '../../data/weather'
import { Card, Confidence, LevelChip, StatTile, VerifyDots, tooltipStyle } from '../../components/ui'

import {
  companyReports, hotspots, hoursLost, incidents, monthlyByReason, referralStages, referrals, roadOwnership,
  thokkotuEvidence, verificationSteps, type CompanyReport,
} from '../../data/mock'

const tabs = ['Overview', 'Company reports', 'Hotspots', 'Road ownership', 'Reports']

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const dayMon = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
type RawCR = Omit<CompanyReport, 'at' | 'groupWith'> & { at: string; groupWith: string | null }
const useCompanyReports = () => useLive<CompanyReport[]>('/company-reports', companyReports, (raw: RawCR[]) => raw.map(r => ({ ...r, at: hhmm(r.at), groupWith: r.groupWith ?? undefined })))
type Referral = (typeof referrals)[number]
const useReferrals = () => useLive<Referral[]>('/referrals', referrals, (raw: (Referral & { sent: string })[]) => raw.map(r => ({ ...r, sent: dayMon(r.sent) })))
const useOwnership = () => useLive('/road-ownership', roadOwnership)

/** Send a referral to the agency that owns the road (backend picks the agency from road ownership when not given). */
async function refer(issue: string, segment: string, agency: string | undefined, reports: number) {
  if (!hasApi) { notify('No backend configured (VITE_API_BASE_URL). The referral was not sent.', false); return }
  try {
    const r = await api<{ id: string; agency: string }>('/referrals', { method: 'POST', json: { issue, segment, agency, reports } })
    notify(`${r.id} sent to ${r.agency}.`); dataChanged()
  } catch (e) { notify((e as Error).message, false) }
}


function IncidentFeed() {
  const { data: incidents } = useIncidents()
  const [open, setOpen] = useState(incidents[0]?.id)
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
  const w = useWeather()
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
            {h.mainCause === 'Flood' && (
              <div className={`mt-2 chip ${w.days[0]?.risk === 'High' ? 'bg-t-severe/15 text-t-severe' : 'bg-teal/15 text-teal'}`}>
                Rain today {w.days[0]?.rainMm ?? 0} mm · {w.days[0]?.risk ?? 'Low'} flood risk{w.live ? ' · live' : ''}
              </div>
            )}
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
  const pdf = (k: string, p: string, n: string) => {
    const rows = monthlyByReason.map(m => `<tr><td>${m.month}</td><td>${m.accident}</td><td>${m.rain}</td><td>${m.repair}</td><td>${m.other}</td></tr>`).join('')
    const hs = hotspots.map(h => `<tr><td>${h.place}</td><td>${h.days} of 30 days</td><td>${h.mainCause}</td><td>${h.hoursLost}</td><td>${h.suggestion}</td></tr>`).join('')
    if (!printAsPdf(`TrafficSense ${k} report ${p}`, `<h1>TrafficSense ${k} evidence report · ${p}</h1><p>${n} · Mangaluru · generated ${new Date().toLocaleString('en-IN')}</p>
      <h2>Incidents by reason</h2><table><tr><th>Month</th><th>Accident</th><th>Rain / flood</th><th>Road repair</th><th>Other</th></tr>${rows}</table>
      <h2>Recurring hotspots</h2><table><tr><th>Place</th><th>Recurrence</th><th>Main cause</th><th>Commuter-hours lost</th><th>Suggested fix</th></tr>${hs}</table>
      <p><small>Supports traffic engineering investigation. Final decisions remain with authorised officials.</small></p>`)) notify('Allow pop-ups to save the PDF.', false)
  }
  return (
    <Card title={<span className="flex items-center gap-2"><FileText size={16} className="text-accent" /> Evidence reports</span>}>
      <div className="grid sm:grid-cols-3 gap-3">
        {[['Monthly', 'Oct 2026', '214 incidents'], ['Quarterly', 'Q3 2026', '688 incidents'], ['Annual', '2025–26', '2,431 incidents']].map(([k, p, n]) => (
          <div key={k} className="rounded-2xl bg-surface-2 p-4">
            <div className="text-xs text-muted font-semibold">{k}</div>
            <div className="font-extrabold text-lg">{p}</div>
            <div className="text-xs text-muted">{n}</div>
            <button className="btn mt-3 w-full !py-1.5 text-xs" onClick={() => pdf(k, p, n)}><Download size={13} /> PDF</button>
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

function CompanyReports({ compact = false, query = '' }: { compact?: boolean; query?: string }) {
  const { data: rows, setData: setRows, live } = useCompanyReports()
  const set = async (id: string, status: CompanyReport['status']) => {
    if (live) {
      try { await api(`/company-reports/${id}?status=${encodeURIComponent(status)}`, { method: 'PATCH' }); dataChanged() } catch (e) { return notify((e as Error).message, false) }
    } else setRows(r => r.map(x => (x.id === id ? { ...x, status } : x)))
    const r = rows.find(x => x.id === id)
    if (status === 'Referred' && r) { const agency = incidents.find(i => i.place === r.place)?.agency; await refer(`${r.reason}, ${r.place}`, r.place, agency, r.employees) }
    else notify(`${id} marked ${status}.`)
  }
  const merge = async (lead: string) => {
    if (live) {
      try { const r = await api<CompanyReport>(`/company-reports/${lead}/merge`, { method: 'POST' }); notify(`Merged into ${lead}: ${r.employees} employees, evidence ${r.evidence.join(', ')}.`); dataChanged() } catch (e) { notify((e as Error).message, false) }
      return
    }
    setRows(r => {
      const d = r.filter(x => x.groupWith === lead)
      return r.filter(x => x.groupWith !== lead).map(x => (x.id === lead ? { ...x, status: 'Verified' as const, employees: x.employees + d.reduce((a, y) => a + y.employees, 0), evidence: [...new Set([...x.evidence, ...d.flatMap(y => y.evidence)])] } : x))
    })
    notify(`Merged into ${lead}.`)
  }
  const dupes = rows.filter(r => r.status === 'Possible duplicate')
  const q = query.trim().toLowerCase()
  const shown = q ? rows.filter(r => [r.id, r.company, r.place, r.reason].some(v => v.toLowerCase().includes(q))) : rows
  const list = compact ? shown.slice(0, 4) : shown
  return (
    <Card title={<span className="flex items-center gap-2"><Building2 size={16} className="text-accent" /> Reports from companies</span>}
      action={<span className="text-xs text-muted">{rows.length} today</span>}>
      {dupes.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-t-moderate/40 bg-t-moderate/10 p-3 text-sm">
          <Copy size={16} className="text-t-moderate" />
          <span className="mr-auto"><b>{dupes.length + 1} reports</b> look like the same incident at {rows.find(r => r.id === dupes[0].groupWith)?.place ?? dupes[0].place}.</span>
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
  const { data: referrals } = useReferrals()
  const { data: reports } = useCompanyReports()
  // New referral = the newest verified company report that has not been referred yet
  const next = reports.find(r => r.status === 'Verified')
  const create = () => next
    ? refer(`${next.reason}, ${next.place}`, next.place, incidents.find(i => i.place === next.place)?.agency, next.employees)
    : notify('No verified company report is waiting for a referral.', false)
  return (
    <Card title={<span className="flex items-center gap-2"><ArrowUpRight size={16} className="text-accent" /> Referral tracking</span>} action={<button className="btn !py-1.5 text-xs" onClick={create}>New referral</button>}>
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
  const { data: roadOwnership, setData, live } = useOwnership()
  const confirm = async (segment: string) => {
    if (live) { try { await api(`/road-ownership/confirm?segment=${encodeURIComponent(segment)}`, { method: 'POST' }); dataChanged() } catch (e) { return notify((e as Error).message, false) } }
    else setData(r => r.map(x => (x.segment === segment ? { ...x, verified: true } : x)))
    notify(`Owner of ${segment} confirmed.`)
  }
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
                <td className="pr-3">{r.verified ? <span className="chip bg-t-free/15 text-t-free">Verified</span> : <button className="btn !py-1 text-xs" onClick={() => confirm(r.segment)}>Confirm owner</button>}</td>
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
        {made && <button className="btn" onClick={() => printAsPdf(`Evidence report ${e.place}`, `<h1>Evidence report · ${e.place}</h1><p>Generated ${new Date().toLocaleString('en-IN')}</p><table><tr><th>Recurrence</th><td>${e.days} of 30 days</td></tr><tr><th>Companies</th><td>${e.companies}</td></tr><tr><th>Reports</th><td>${e.reports}</td></tr><tr><th>Employees hit</th><td>${e.employeesAffected}</td></tr><tr><th>Avg delay</th><td>${e.avgDelay} min</td></tr><tr><th>Commuter-hours lost</th><td>${e.hoursLost}</td></tr><tr><th>Traffic speed</th><td>${e.mapsSpeed}</td></tr><tr><th>Responsible agency</th><td>${e.responsible}</td></tr></table><p><small>Supports a traffic engineering investigation. It is not a final finding.</small></p>`) || notify('Allow pop-ups to save the PDF.', false)}><Download size={15} /> Download PDF</button>}
        {made && <button className="btn" onClick={() => refer(`Recurring congestion, ${e.place}`, e.place, e.responsible, e.reports)}><ArrowUpRight size={15} /> Refer to {e.responsible}</button>}
      </div>
      <p className="mt-3 text-[11px] text-muted">Supports a traffic engineering investigation. It is not a final finding.</p>
    </Card>
  )
}

export default function GovDashboard() {
  const theme = useThemeMode('gov', 'dark')
  const [tab, setTab] = useState('Overview')
  const [query, setQuery] = useState('')
  const { data: liveReports } = useCompanyReports()
  const { data: liveReferrals } = useReferrals()
  const search = () => { const q = window.prompt('Search company reports (place, company, reason or ID)', query); if (q !== null) { setQuery(q); setTab('Company reports') } }

  const tiles = (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
      <StatTile label="Company reports today" value={liveReports.length} color="#ff6b1a" />
      <StatTile label="Duplicates found" value={liveReports.filter(r => r.status === 'Possible duplicate').length} color="#9aa23a" />
      <StatTile label="Hours lost today" value="2.7k" color="#eab308" />
      <StatTile label="Recurring hotspots" value={hotspots.length} color="#2bb3a3" />
      <StatTile label="Referrals open" value={liveReferrals.filter(r => r.stage < 3).length} color="#22a447" />
    </div>
  )

  return (
    <ControlShell sub="Authority Portal · Mangaluru" tabs={tabs} active={tab} onTab={setTab} onSearch={search} theme={theme}
      user={{ initials: 'TP', name: 'Traffic Police Control Room' }}
      cta={<span className="btn !bg-olive !border-olive !text-white hidden sm:inline-flex"><ShieldCheck size={15} /><span className="hidden 2xl:inline">Authorised officer</span></span>}>
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
        <div className="grid gap-5 xl:grid-cols-[1fr_420px]"><CompanyReports query={query} /><IncidentFeed /></div>
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
