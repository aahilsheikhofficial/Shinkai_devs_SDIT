import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownUp, CalendarDays, RotateCcw, Search, Users } from 'lucide-react'
import { Card } from '../../components/ui'
import { employees } from '../../data/mock'

/*
 * Employee status = the live travel board (data/mock.ts `employees`). Each record is today's status for one employee,
 * so the record date is today. There is no history in the data yet: other dates show an empty state, not made-up rows.
 */
const STATUSES = ['On time', 'Delayed', 'At office', 'Not started'] as const
const statusStyle: Record<string, string> = {
  Delayed: 'bg-t-severe/15 text-t-severe', 'On time': 'bg-t-free/15 text-t-free', 'At office': 'bg-teal/15 text-teal', 'Not started': 'bg-surface-2 text-muted',
}
const isoToday = () => new Date().toLocaleDateString('en-CA') // local YYYY-MM-DD, no UTC shift
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('/')

export default function EmployeeStatusPage() {
  const today = isoToday()
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('All')
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  useEffect(() => { const v = params.get('q'); if (v !== null) setQ(v) }, [params])
  const [byDelay, setByDelay] = useState(false)

  const records = employees.map(e => ({ ...e, date: today }))
  const needle = q.trim().toLowerCase()
  const rows = records
    .filter(r => r.date === date && (status === 'All' || r.status === status) &&
      (!needle || [r.name, r.initials, r.route, r.reason ?? ''].some(x => x.toLowerCase().includes(needle))))
    .sort((a, b) => (byDelay ? b.delayMin - a.delayMin : 0))
  const reset = () => { setDate(today); setStatus('All'); setQ(''); setByDelay(false) }
  const sel = 'input !w-auto !py-2 !px-3 !rounded-full text-[13px] font-semibold cursor-pointer'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Employee Status</h2>
          <p className="text-sm text-muted">Monitor employee arrivals, delays, routes, and reported reasons.</p>
        </div>
        <span className="chip bg-surface-2 text-ink !text-[13px] !py-1.5 !px-3"><Users size={14} /> Total employees: {new Set(employees.map(e => e.initials)).size}</span>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-[13px] font-semibold" title="Pick a date">
          <CalendarDays size={15} className="text-muted" /> Date: {ddmmyyyy(date)}
          <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} aria-label="Date"
            className="absolute inset-0 opacity-0 cursor-pointer" onClick={e => (e.currentTarget as HTMLInputElement).showPicker?.()} />
        </label>
        <select className={sel} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status">
          <option value="All">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <label className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !py-2 !pl-10 !rounded-full text-[13px]" placeholder="Search employee, route or reason…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search employees" />
        </label>
        <button className="btn !py-2 text-[13px]" onClick={reset}><RotateCcw size={14} /> Reset Filters</button>
        <span className="ml-auto text-xs text-muted">{rows.length} matching record{rows.length === 1 ? '' : 's'}</span>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 font-semibold">Employee Name</th><th className="font-semibold">Route</th><th className="font-semibold">Status</th>
                <th className="font-semibold"><button className="inline-flex items-center gap-1 hover:text-ink cursor-pointer" onClick={() => setByDelay(!byDelay)} title="Sort by delay">Delay <ArrowDownUp size={12} className={byDelay ? 'text-accent' : ''} /></button></th>
                <th className="font-semibold">Date</th><th className="font-semibold">Reason</th><th className="font-semibold">Verification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(e => (
                <tr key={e.initials} className="border-t border-line hover:bg-surface-2 transition-colors">
                  <td className="py-3 pr-3"><span className="flex items-center gap-2.5 font-semibold"><span className="grid place-items-center size-8 shrink-0 rounded-full bg-surface-2 text-[11px] font-bold">{e.initials}</span>{e.name}</span></td>
                  <td className="pr-3 text-muted">{e.route || '—'}</td>
                  <td className="pr-3"><span className={`chip whitespace-nowrap ${statusStyle[e.status]}`}>{e.status}</span></td>
                  <td className="pr-3 font-semibold tabular-nums">{e.status === 'Delayed' && e.delayMin ? `+${e.delayMin} min` : '—'}</td>
                  <td className="pr-3 tabular-nums">{ddmmyyyy(e.date)}</td>
                  <td className="pr-3">{e.reason ?? '—'}</td>
                  <td>{e.verified === undefined ? '—' : e.verified ? <span className="chip bg-t-free/15 text-t-free">GPS evidence</span> : <span className="chip bg-t-moderate/15 text-t-moderate">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="py-12 text-center text-sm text-muted">
              {date !== today ? `No records for ${ddmmyyyy(date)}. Only today's live status is stored so far.` : 'No employees match these filters.'}{' '}
              <button className="font-semibold text-accent hover:underline cursor-pointer" onClick={reset}>Reset filters</button>
            </p>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted">Date is the day of the status record (today's live board). Not started means no arrival yet, not late.</p>
      </Card>
    </div>
  )
}
