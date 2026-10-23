import type { ReactNode } from 'react'
import { levelColor, type Level } from '../data/mock'

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function LevelChip({ level, children }: { level: Level; children: ReactNode }) {
  const c = levelColor[level]
  return (
    <span className="chip" style={{ background: `color-mix(in srgb, ${c} 16%, transparent)`, color: level === 'closed' ? 'var(--text)' : c }}>
      <span className="size-1.5 rounded-full" style={{ background: c, outline: level === 'closed' ? '1px solid var(--muted)' : undefined }} />
      {children}
    </span>
  )
}

export function Confidence({ value }: { value: number }) {
  const c = value >= 85 ? '#22c55e' : value >= 65 ? '#eab308' : '#ef4444'
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-2">
        <span className="block h-full rounded-full" style={{ width: `${value}%`, background: c }} />
      </span>
      {value}%
    </span>
  )
}

export function VerifyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`Verification level ${level} of 6`}>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="size-1.5 rounded-full" style={{ background: i < level ? 'var(--accent)' : 'var(--border)' }} />
      ))}
      <span className="ml-1 text-[11px] font-semibold text-muted">L{level}</span>
    </span>
  )
}

/** Colourful stat tile like the Vexora reference. */
export function StatTile({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div className="rounded-2xl px-4 py-3 text-white transition-transform hover:-translate-y-0.5 cursor-default" style={{ background: color }}>
      <div className="text-[12px] font-semibold opacity-90">{label}</div>
      <div className="mt-1 text-2xl font-extrabold leading-none">{value}{unit && <span className="ml-1 text-xs font-semibold opacity-85">{unit}</span>}</div>
    </div>
  )
}

export const tooltipStyle = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text)' },
  labelStyle: { color: 'var(--muted)', fontWeight: 600 },
  cursor: { fill: 'var(--surface-2)' },
}
