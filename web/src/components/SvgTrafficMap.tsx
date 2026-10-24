import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import {
  employees as allEmployees, hotspots as allHotspots, incidents as allIncidents,
  levelColor, levelLabel, places, segments, type Employee, type Hotspot, type Incident,
} from '../data/mock'

// Stylised Mangaluru map drawn in SVG so the demo needs no API key.
// Used as a fallback when no Google Maps key is set in .env.

const MAIN_ROUTE = 'M285 515 L340 505 L405 492 L415 440 L425 382 L500 372 L575 365 L690 345'
const ALT_ROUTE = 'M405 492 L415 440 L470 425 L540 400 L575 365'

// Deterministic "minor street" texture
const streets: string[] = (() => {
  const out: string[] = []
  let s = 7
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 70; i++) {
    const x = 230 + rnd() * 580
    const y = rnd() * 560
    const len = 30 + rnd() * 70
    const a = rnd() * Math.PI
    out.push(`M${x.toFixed(0)} ${y.toFixed(0)} l${(Math.cos(a) * len).toFixed(0)} ${(Math.sin(a) * len).toFixed(0)}`)
  }
  return out
})()

export type TrafficMapProps = {
  className?: string
  showIncidents?: boolean | Incident[]
  showEmployees?: boolean | Employee[]
  showHotspots?: boolean | Hotspot[]
  showRoute?: boolean
  showAltRoute?: boolean
  showLegend?: boolean
  labels?: boolean
  /** Show the place search box (Google map only) */
  search?: boolean
}

export default function SvgTrafficMap({
  className = '', showIncidents = true, showEmployees = false, showHotspots = false,
  showRoute = false, showAltRoute = false, showLegend = true, labels = true,
}: TrafficMapProps) {
  const [zoom, setZoom] = useState(1)
  const [hover, setHover] = useState<string | null>(null)
  const incidents = showIncidents === true ? allIncidents : showIncidents || []
  const employees = showEmployees === true ? allEmployees : showEmployees || []
  const hotspots = showHotspots === true ? allHotspots : showHotspots || []
  const w = 800 / zoom, h = 560 / zoom
  const vb = `${(800 - w) / 2 + (zoom > 1 ? 40 : 0)} ${(560 - h) / 2 + (zoom > 1 ? 40 : 0)} ${w} ${h}`

  return (
    <div className={`relative overflow-hidden rounded-[1.1rem] ${className}`} style={{ background: 'var(--map-land)' }}>
      <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full transition-all duration-500" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="#ef4444" stopOpacity=".75" />
            <stop offset="45%" stopColor="#f97316" stopOpacity=".35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* water: Arabian Sea + Gurupura + Netravati */}
        <path d="M-200 -200 H215 C200 80 225 140 205 200 C190 260 215 320 200 380 C188 440 210 500 195 760 H-200Z" fill="var(--map-water)" />
        <path d="M205 95 C280 90 320 102 372 100 C450 96 520 72 1000 60" stroke="var(--map-water)" strokeWidth="16" fill="none" />
        <path d="M200 455 C260 450 340 458 410 452 C500 445 600 432 1000 418" stroke="var(--map-water)" strokeWidth="20" fill="none" />
        {labels && <>
          <text x="95" y="290" fill="var(--map-label)" fontSize="13" fontStyle="italic" textAnchor="middle" opacity=".8">Arabian Sea</text>
          <text x="640" y="424" fill="var(--map-label)" fontSize="10" fontStyle="italic" opacity=".8" transform="rotate(-3 640 424)">Netravati River</text>
        </>}
        {streets.map((d, i) => <path key={i} d={d} stroke="var(--map-road-minor)" strokeWidth="2" strokeLinecap="round" />)}
        {/* road casing */}
        {segments.map(s => <path key={s.id + 'c'} d={s.path} stroke="var(--map-road)" strokeWidth={s.major ? 13 : 9} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
        <path d={ALT_ROUTE} stroke="var(--map-road)" strokeWidth="9" fill="none" strokeLinecap="round" />
        {/* traffic colour layer */}
        {segments.map(s => (
          <path key={s.id} d={s.path} stroke={levelColor[s.level]} strokeWidth={s.major ? 5 : 3.5} fill="none"
            strokeLinecap="round" strokeLinejoin="round" opacity={hover && hover !== s.id ? .45 : .95}
            strokeDasharray={s.level === 'closed' ? '6 5' : undefined}
            onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer', transition: 'opacity .2s' }}>
            <title>{`${s.name}: ${levelLabel[s.level]}`}</title>
          </path>
        ))}

        {hotspots.map(h => <circle key={h.place} cx={h.x} cy={h.y} r={22 + h.days * 2.2} fill="url(#heat)" />)}

        {showAltRoute && <path d={ALT_ROUTE} stroke="#2bb3a3" strokeWidth="5" fill="none" strokeDasharray="2 9" strokeLinecap="round" className="route-flow" />}
        {showRoute && <>
          <path d={MAIN_ROUTE} stroke="var(--accent)" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".35" filter="url(#glow)" />
          <path d={MAIN_ROUTE} stroke="var(--accent)" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="285" cy="515" r="7" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" />
          <g transform="translate(690 345)">
            <circle r="16" fill="var(--accent)" opacity=".25" />
            <circle r="8" fill="var(--accent)" stroke="#fff" strokeWidth="2.5" />
          </g>
        </>}

        {labels && Object.values(places).map(p => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="2.5" fill="var(--map-label)" />
            <text x={p.x + 7} y={p.y - 6} fill="var(--map-label)" fontSize="10.5" fontWeight="600">{p.name}</text>
          </g>
        ))}

        {incidents.map(i => (
          <g key={i.id} transform={`translate(${i.x} ${i.y})`} style={{ cursor: 'pointer' }}>
            <circle r="6" fill={levelColor[i.level]} className="pulse-ring" />
            <circle r="9" fill={levelColor[i.level]} stroke="#fff" strokeWidth="2.5" />
            <text y="3.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800">!</text>
            <title>{`${i.reason} at ${i.place}: +${i.delayMin} min, ${i.confidence}% confidence`}</title>
          </g>
        ))}

        {employees.map(e => {
          const c = e.status === 'Delayed' ? '#ef4444' : e.status === 'Not started' ? '#8b847a' : '#22c55e'
          return (
            <g key={e.name} transform={`translate(${e.x} ${e.y})`}>
              <circle r="12" fill="var(--surface)" stroke={c} strokeWidth="3" />
              <text y="3.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--text)">{e.initials}</text>
              <title>{`${e.name}: ${e.status}${e.delayMin ? ` (+${e.delayMin} min)` : ''}`}</title>
            </g>
          )
        })}
      </svg>

      <div className="absolute right-3 top-3 flex gap-1.5">
        <button className="btn btn-icon !bg-surface/90 backdrop-blur" onClick={() => setZoom(z => Math.max(1, z - .3))} aria-label="Zoom out"><Minus size={15} /></button>
        <button className="btn btn-icon !bg-surface/90 backdrop-blur" onClick={() => setZoom(z => Math.min(2.2, z + .3))} aria-label="Zoom in"><Plus size={15} /></button>
      </div>

      {showLegend && (
        <div className="absolute left-3 bottom-3 flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-surface/90 px-3 py-2 text-[11px] font-semibold backdrop-blur border border-line">
          {(Object.keys(levelColor) as (keyof typeof levelColor)[]).map(l => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full" style={{ background: levelColor[l], outline: l === 'closed' ? '1px solid var(--muted)' : undefined }} />
              {levelLabel[l]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
