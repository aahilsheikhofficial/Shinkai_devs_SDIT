import { useEffect, useRef, useState } from 'react'
import { Bell, MapPin } from 'lucide-react'
import { useIncidents } from '../data/api'
import { LevelChip } from './ui'
import { levelLabel } from '../data/mock'

/** Bell that opens the active incident alerts (live from the backend when connected). */
export default function NotificationsBell({ className = 'btn btn-icon relative', size = 16, dot = 'bg-t-severe', only }: { className?: string; size?: number; dot?: string; only?: string[] }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { data, live } = useIncidents()
  const items = only ? data.filter(i => only.includes(i.id)) : data
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div className="relative" ref={box}>
      <button className={className} aria-label="Notifications" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Bell size={size} />{items.length > 0 && <span className={`absolute top-1.5 right-1.5 size-2 rounded-full ${dot}`} />}
      </button>
      {open && (
        <div className="card absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted"><b className="text-ink text-sm">Alerts</b>{live ? 'live' : 'demo data'}</div>
          {items.length === 0 ? <p className="p-3 text-sm text-muted">No active alerts.</p> : (
            <ul className="max-h-80 space-y-1.5 overflow-y-auto">
              {items.map(i => (
                <li key={i.id} className="rounded-xl p-2 hover:bg-surface-2">
                  <div className="flex items-center justify-between gap-2"><b className="text-sm">{i.reason}</b><LevelChip level={i.level}>{i.level === 'closed' ? levelLabel.closed : `+${i.delayMin} min`}</LevelChip></div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin size={12} />{i.place} · since {i.since} · L{i.verification}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
