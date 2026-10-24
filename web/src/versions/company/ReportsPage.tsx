import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Download, FilePlus2, Loader2, Send } from 'lucide-react'
import TrafficMap from '../../components/TrafficMap'
import { Card, Confidence, LevelChip } from '../../components/ui'
import { affectedBy, employees, isConfirmed, levelLabel } from '../../data/mock'
import { api, hasApi, useIncidents } from '../../data/api'
import { useWeather } from '../../data/weather'
import EmployeeStatusPage from './EmployeeStatusPage'
import WeatherPage, { buildRows } from './WeatherPage'

/*
 * Weekly report: review -> analyse -> generate -> preview -> approve -> submit.
 * Generation is a plain template over existing records (no AI). Submission goes to TrafficSense's own Authority Portal
 * (backend POST /company-reports). Only what that server returns counts as submitted; otherwise it is Failed /
 * Manual submission required and the user downloads the report.
 */
const COMPANY = 'Infinite Tech Pvt Ltd'
const PREVIEW = 4
const HISTORY_KEY = 'ts-weekly-reports'

const iso = (d: Date) => d.toLocaleDateString('en-CA')
const dmy = (s: string) => s.split('-').reverse().join('/')
function weekOf(offset: number) {
  const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { from: iso(mon), to: iso(sun) }
}

type Status = 'Draft' | 'Ready for review' | 'Approved' | 'Submitting' | 'Submitted' | 'Failed' | 'Manual submission required'
type Report = { id: string; from: string; to: string; createdAt: string; createdBy: string; version: number; body: string; status: Status; approvedAt?: string; submittedAt?: string; refs?: string[]; error?: string }
const loadHistory = (): Report[] => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] } }
const saveHistory = (h: Report[]) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)) } catch { /* storage blocked */ } }
const statusChip: Record<Status, string> = {
  Draft: 'bg-surface-2 text-muted', 'Ready for review': 'bg-t-moderate/15 text-t-moderate', Approved: 'bg-teal/15 text-teal', Submitting: 'bg-surface-2 text-muted',
  Submitted: 'bg-t-free/15 text-t-free', Failed: 'bg-t-severe/15 text-t-severe', 'Manual submission required': 'bg-accent/15 text-accent',
}

type Detail = 'weather' | 'road' | 'employees' | null

function Section({ title, onAll, children, empty }: { title: string; onAll: () => void; children: ReactNode; empty: boolean }) {
  return (
    <Card title={title} action={<button className="btn !py-1.5 text-xs" onClick={onAll}>View full analysis <ChevronRight size={13} /></button>}>
      {empty ? <p className="py-8 text-center text-sm text-muted">No records in this reporting period.</p> : <div className="overflow-x-auto">{children}</div>}
    </Card>
  )
}
const th = 'py-2 pr-3 font-semibold'
const tr = 'border-t border-line hover:bg-surface-2 transition-colors cursor-pointer'

export default function ReportsPage({ extra }: { extra?: ReactNode }) {
  const w = useWeather()
  const { data: incidents } = useIncidents()
  const [week, setWeek] = useState(0) // 0 = this week (in progress), -1 = last week
  const { from, to } = weekOf(week)
  const [detail, setDetail] = useState<Detail>(null)
  const [history, setHistory] = useState<Report[]>(loadHistory)
  const [current, setCurrent] = useState<Report | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  useEffect(() => saveHistory(history), [history])
  useEffect(() => { setCurrent(null); setConfirmed(false) }, [from])

  const today = iso(new Date())
  const inPeriod = (d: string) => d >= from && d <= to
  // Records are today's (live board + today's incidents). Forecast days inside the week are labelled Forecast.
  const todayIn = inPeriod(today)
  const weatherRows = buildRows(w.days.filter(d => inPeriod(d.date)), employees.map(e => ({ id: e.initials, name: e.name, route: e.route })))
  const roadRows = todayIn ? incidents.map(i => ({ ...i, hit: affectedBy(i.reason) })) : []
  const empRows = todayIn ? employees : []

  const checks = [
    { key: 'weather' as const, name: 'Weather Weekly Status', ok: w.live, why: w.live ? `${weatherRows.length} records from the live forecast and attendance.` : 'Forecast is sample data (offline). Re-check when the live forecast loads.' },
    { key: 'road' as const, name: 'Road & Map Weekly Status', ok: roadRows.every(r => r.verification >= 3), why: roadRows.filter(r => r.verification < 3).length ? `${roadRows.filter(r => r.verification < 3).map(r => r.id).join(', ')} below verification level 3.` : `${roadRows.length} incidents, all with 3+ independent checks.` },
    { key: 'employees' as const, name: 'Employee Weekly Status', ok: empRows.every(e => e.status !== 'Delayed' || e.verified), why: empRows.filter(e => e.status === 'Delayed' && !e.verified).length ? `${empRows.filter(e => e.status === 'Delayed' && !e.verified).map(e => e.name).join(', ')}: delay evidence pending.` : `${empRows.length} employees, delays backed by evidence.` },
  ]

  function generate() {
    if (from > to) return
    const delayed = empRows.filter(e => e.status === 'Delayed')
    const verified = roadRows.filter(r => isConfirmed(r.verification))
    const lines = [
      `# TrafficSense weekly commute report`,
      `Company: ${COMPANY}`, `Reporting period: ${dmy(from)} – ${dmy(to)}${week === 0 ? ' (week in progress)' : ''}`, `Generated: ${new Date().toLocaleString('en-IN')}`, '',
      `## 1. Executive summary`,
      `- ${roadRows.length} road problems recorded; ${verified.length} confirmed by an authority, ${roadRows.length - verified.length} predicted or partly verified.`,
      `- ${delayed.length} of ${empRows.length} employees delayed; total ${delayed.reduce((a, e) => a + e.delayMin, 0)} minutes.`,
      `- ${weatherRows.filter(r => r.dateKind === 'Forecast').length} forecast weather risks on employee routes; ${weatherRows.filter(r => r.dateKind === 'Observed').length} observed weather impacts.`, '',
      `## 2. Weather weekly status`,
      ...(weatherRows.length ? weatherRows.map(r => `- ${dmy(r.date)} [${r.dateKind}] ${r.place}: ${r.cause}${r.dateKind === 'Forecast' ? ' (predicted)' : ''} — ${r.status}; ${r.emps.length} employee(s) ${r.dateKind === 'Forecast' ? 'potentially ' : ''}affected`) : ['- No records.']), '',
      `## 3. Road problems and hotspots`,
      ...(roadRows.length ? roadRows.map(r => `- ${r.id} ${r.place}: ${r.reason} (${isConfirmed(r.verification) ? 'confirmed' : `predicted, verification L${r.verification}`}), ${levelLabel[r.level]}, +${r.delayMin} min, ${r.reports} reports, cause confidence ${r.confidence}%${r.agency ? `, agency ${r.agency}` : ''}`) : ['- No records.']), '',
      `## 4. Employee weekly status`,
      ...(empRows.length ? empRows.map(e => `- ${e.name} (${e.route}): ${e.status}${e.status === 'Delayed' ? ` +${e.delayMin} min, reason ${e.reason ?? '—'}, evidence ${e.verified ? 'GPS' : 'pending'}` : ''}`) : ['- No records.']), '',
      `## 5. Affected routes and commute impact`,
      ...([...new Set(delayed.map(e => e.route))].map(r => `- ${r}: ${delayed.filter(e => e.route === r).map(e => `${e.name} +${e.delayMin} min`).join(', ')}`).concat(delayed.length ? [] : ['- None.'])), '',
      `## 6. Verified incidents and evidence references`,
      ...(verified.length ? verified.map(r => `- ${r.id} ${r.place}: confirmed by ${r.agency ?? 'authority'}, ${r.reports} user reports`) : ['- No authority-confirmed incidents.']), '',
      `## 7. Missing information and limitations`,
      ...checks.filter(c => !c.ok).map(c => `- ${c.name}: ${c.why}`),
      `- Only today's live records are stored so far; earlier days of the week have no history.`, '',
      `## 8. Recommended actions`,
      ...roadRows.filter(r => r.agency && r.verification >= 4).map(r => `- Ask ${r.agency} to act on ${r.place} (${r.reason.toLowerCase()}).`),
    ]
    const r: Report = { id: `WR-${Date.now().toString(36).toUpperCase()}`, from, to, createdAt: new Date().toISOString(), createdBy: 'Mohammed Safaf (HR manager)', version: (history.filter(h => h.from === from).length) + 1, body: lines.join('\n'), status: 'Ready for review' }
    setCurrent(r); setConfirmed(false); setHistory(h => [r, ...h])
  }
  const update = (patch: Partial<Report>) => { if (!current) return; const r = { ...current, ...patch }; setCurrent(r); setHistory(h => h.map(x => (x.id === r.id ? r : x))) }
  const download = () => { if (!current) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([current.body], { type: 'text/markdown' })); a.download = `${current.id}_${current.from}_${current.to}.md`; a.click() }

  async function submit() {
    if (!current || current.status !== 'Approved') return
    if (!hasApi) { update({ status: 'Manual submission required', error: 'No Authority Portal server configured (VITE_API_BASE_URL). Download and submit manually.' }); return }
    update({ status: 'Submitting', error: undefined })
    try {
      const toSend = roadRows.filter(r => r.verification >= 4)
      const refs: string[] = []
      for (const r of toSend) {
        const res = await api<{ id: string }>('/company-reports', {
          method: 'POST',
          json: { company: COMPANY, place: r.place, reason: r.reason, employees: r.hit.length, delayMin: r.delayMin, evidence: ['GPS', `Weekly report ${current.id}`] },
        })
        refs.push(res.id)
      }
      update({ status: 'Submitted', submittedAt: new Date().toISOString(), refs })
    } catch (e) {
      update({ status: 'Failed', error: `${(e as Error).message} Nothing was confirmed by the portal. Retry, or download and submit manually.` })
    }
  }

  const back = <button className="btn !py-1.5 text-xs" onClick={() => setDetail(null)}><ArrowLeft size={13} /> Back to Reports · {dmy(from)} – {dmy(to)}</button>
  if (detail === 'weather') return <div className="space-y-4">{back}<WeatherPage /></div>
  if (detail === 'employees') return <div className="space-y-4">{back}<EmployeeStatusPage /></div>
  if (detail === 'road') return (
    <div className="space-y-4">{back}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] items-start">
        <Card title="Road & Map Weekly Analysis">
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className={th}>Problem / Location</th><th className={th}>Cause</th><th className={th}>Confidence</th><th className={th}>Status</th><th className={th}>Reports</th><th className={th}>Affected</th><th className={th}>Since</th></tr></thead>
            <tbody>{roadRows.map(r => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="py-2.5 pr-3 font-semibold">{r.place}<div className="text-[11px] text-muted">{r.id}{r.agency ? ` · ${r.agency}` : ''}</div></td>
                <td className="pr-3">{r.reason}<div className="text-[11px] text-muted">{isConfirmed(r.verification) ? 'confirmed' : 'predicted'}</div></td>
                <td className="pr-3"><Confidence value={r.confidence} /></td>
                <td className="pr-3"><LevelChip level={r.level}>{levelLabel[r.level]}</LevelChip><div className="text-[11px] text-muted mt-1">Verification L{r.verification}</div></td>
                <td className="pr-3">{r.reports}</td>
                <td className="pr-3">{r.hit.length ? r.hit.map(e => e.name).join(', ') : '—'}</td>
                <td>{dmy(today)} {r.since}</td>
              </tr>))}</tbody>
          </table></div>
          {!roadRows.length && <p className="py-8 text-center text-sm text-muted">No road problems in this period.</p>}
        </Card>
        <div className="card p-3"><TrafficMap className="h-[460px]" showIncidents showHotspots /></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Weekly Reports</h2>
          <p className="text-sm text-muted">Review weather risks, road incidents, and employee commute status before generating the weekly report.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select className="input !w-auto !py-2 !px-3 !rounded-full text-[13px] font-semibold cursor-pointer" value={week} onChange={e => setWeek(Number(e.target.value))} aria-label="Reporting period">
            <option value={0}>This week (in progress)</option><option value={-1}>Last week</option><option value={-2}>2 weeks ago</option>
          </select>
          <span className="chip bg-surface-2 text-ink !text-[13px] !py-1.5 !px-3">{dmy(from)} – {dmy(to)}</span>
          <span className="text-muted">Data updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 items-start">
        <Section title="Weather Weekly Status" onAll={() => setDetail('weather')} empty={!weatherRows.length}>
          <table className="w-full text-sm"><thead className="text-left text-xs text-muted"><tr><th className={th}>Day / Date</th><th className={th}>Weather / Risk</th><th className={th}>Route / Area</th><th className={th}>Reason / Impact</th></tr></thead>
            <tbody>{weatherRows.slice(0, PREVIEW).map(r => (
              <tr key={r.key} className={tr} onClick={() => setDetail('weather')}>
                <td className="py-2.5 pr-3 whitespace-nowrap">{dmy(r.date)}<div className="text-[11px] text-muted">{r.dateKind}</div></td>
                <td className="pr-3">{r.status}</td><td className="pr-3">{r.place}</td>
                <td className="pr-3">{r.cause}{r.dateKind === 'Forecast' && <span className="text-[11px] text-muted"> · predicted, {r.emps.length} potentially affected</span>}</td>
              </tr>))}</tbody></table>
        </Section>
        <Section title="Road & Map Weekly Status" onAll={() => setDetail('road')} empty={!roadRows.length}>
          <table className="w-full text-sm"><thead className="text-left text-xs text-muted"><tr><th className={th}>Problem / Location</th><th className={th}>Route</th><th className={th}>Reason / Cause</th><th className={th}>Impact / Status</th></tr></thead>
            <tbody>{roadRows.slice(0, PREVIEW).map(r => (
              <tr key={r.id} className={tr} onClick={() => setDetail('road')}>
                <td className="py-2.5 pr-3 font-semibold">{r.place}</td>
                <td className="pr-3 text-muted">{[...new Set(r.hit.map(e => e.route))].join(', ') || '—'}</td>
                <td className="pr-3">{r.reason}<div className="text-[11px] text-muted">{isConfirmed(r.verification) ? 'confirmed' : 'predicted'}</div></td>
                <td className="pr-3"><LevelChip level={r.level}>{levelLabel[r.level]}</LevelChip><div className="text-[11px] text-muted mt-1">{r.hit.length} affected · L{r.verification}</div></td>
              </tr>))}</tbody></table>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 items-start">
        <Section title="Employee Weekly Status" onAll={() => setDetail('employees')} empty={!empRows.length}>
          <table className="w-full text-sm"><thead className="text-left text-xs text-muted"><tr><th className={th}>Employee Name</th><th className={th}>Route</th><th className={th}>Status</th><th className={th}>Delay</th></tr></thead>
            <tbody>{[...empRows].sort((a, b) => b.delayMin - a.delayMin).slice(0, PREVIEW).map(e => (
              <tr key={e.initials} className={tr} onClick={() => setDetail('employees')}>
                <td className="py-2.5 pr-3 font-semibold">{e.name}</td><td className="pr-3 text-muted">{e.route}</td><td className="pr-3">{e.status}</td>
                <td className="pr-3 font-semibold">{e.status === 'Delayed' ? `+${e.delayMin} min` : '—'}</td>
              </tr>))}</tbody></table>
        </Section>

        <Card title="Weekly Report Preparation">
          <ul className="space-y-2">
            {checks.map(c => (
              <li key={c.key} className="flex items-start gap-3 rounded-xl bg-surface-2 p-3">
                {c.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-t-free" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-t-moderate" />}
                <div className="mr-auto min-w-0"><div className="text-sm font-semibold">{c.name} · <span className={c.ok ? 'text-t-free' : 'text-t-moderate'}>{c.ok ? 'Ready' : 'Needs review'}</span></div><div className="text-xs text-muted">{c.why}</div></div>
                <button className="btn !py-1 text-xs" onClick={() => setDetail(c.key)}>Open</button>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary mt-4 w-full !py-3" onClick={generate}><FilePlus2 size={16} /> Create Weekly Report</button>
          <p className="mt-2 text-center text-[11px] text-muted">Built from the records above with a fixed template. No AI. Items marked Needs review are listed in the report's limitations.</p>
        </Card>
      </div>

      {current && (
        <Card title={<span className="flex flex-wrap items-center gap-2">Report preview · {current.id} v{current.version} <span className={`chip ${statusChip[current.status]}`}>{current.status}</span></span>}
          action={<span className="flex gap-2"><button className="btn !py-1.5 text-xs" onClick={generate}>Regenerate</button><button className="btn !py-1.5 text-xs" onClick={download}><Download size={13} /> Download</button></span>}>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-4 text-xs leading-relaxed">{current.body}</pre>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {current.status === 'Ready for review' && (<>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I have checked this report and approve it.</label>
              <button className="btn" disabled={!confirmed} onClick={() => update({ status: 'Approved', approvedAt: new Date().toISOString() })}>Approve</button>
            </>)}
            {(current.status === 'Approved' || current.status === 'Failed') && (
              <button className="btn btn-primary" onClick={() => { if (window.confirm(`Send the verified road problems in ${current.id} to the TrafficSense Authority Portal?`)) { if (current.status === 'Failed') update({ status: 'Approved' }); setTimeout(submit) } }}>
                <Send size={15} /> Submit Report
              </button>
            )}
            {current.status === 'Submitting' && <span className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> Sending to the Authority Portal…</span>}
            {current.status === 'Submitted' && <span className="text-sm text-t-free">Received by the Authority Portal as {current.refs?.join(', ') || 'no new items (nothing at L4+)'}.</span>}
            {current.error && <span className="text-sm text-t-severe">{current.error}</span>}
          </div>
        </Card>
      )}

      {!!history.length && (
        <Card title="Report history" action={<span className="text-xs text-muted">saved in this browser</span>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className={th}>Report</th><th className={th}>Period</th><th className={th}>Created</th><th className={th}>Approved</th><th className={th}>Status</th><th className={th}>Portal reference</th></tr></thead>
            <tbody>{history.slice(0, 8).map(h => (
              <tr key={h.id} className={tr} onClick={() => { setWeek(0); setCurrent(h) }}>
                <td className="py-2.5 pr-3 font-semibold">{h.id} v{h.version}</td><td className="pr-3">{dmy(h.from)} – {dmy(h.to)}</td>
                <td className="pr-3">{new Date(h.createdAt).toLocaleString('en-IN')}<div className="text-[11px] text-muted">{h.createdBy}</div></td>
                <td className="pr-3">{h.approvedAt ? new Date(h.approvedAt).toLocaleString('en-IN') : '—'}</td>
                <td className="pr-3"><span className={`chip ${statusChip[h.status]}`}>{h.status}</span></td>
                <td>{h.refs?.join(', ') || '—'}</td>
              </tr>))}</tbody>
          </table></div>
        </Card>
      )}
      {extra}
    </div>
  )
}
