import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Camera, CarFront, CloudRain, Construction, LogOut, MapPin, Navigation, Phone, Search, Smartphone, TrafficCone } from 'lucide-react'
import Logo from '../../components/Logo'
import TrafficMap from '../../components/TrafficMap'
import { ThemeToggle, useThemeMode } from '../../components/theme'
import { Card, Confidence, LevelChip, VerifyDots } from '../../components/ui'
import { incidents } from '../../data/mock'

const kinds = [
  { label: 'Accident', icon: CarFront },
  { label: 'Road repair', icon: Construction },
  { label: 'Flood / rain', icon: CloudRain },
  { label: 'Signal down', icon: TrafficCone },
]

export default function CommuterView() {
  const theme = useThemeMode('commuter', 'light')
  const [kind, setKind] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <Logo sub="Commuter" />
        <div className="relative flex-1 min-w-[200px] max-w-md mx-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !rounded-full !pl-10" defaultValue="Ullal → Hampankatta" />
        </div>
        <ThemeToggle {...theme} />
        <Link to="/" className="btn btn-icon" aria-label="Log out"><LogOut size={16} /></Link>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="card relative p-3">
          <TrafficMap className="h-[calc(100vh-150px)] min-h-[480px]" showIncidents showRoute showAltRoute />
          <div className="absolute left-6 top-6 right-20 sm:right-auto sm:max-w-sm card p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><AlertTriangle size={16} className="text-t-severe" /> Accident ahead at Pumpwell</div>
            <p className="text-xs text-muted mt-1">+32 min · 14 people reported · verified by GPS speed (2 km/h for 30 min)</p>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary !py-2 flex-1"><Navigation size={15} /> Avoid (−14 min)</button>
              <button className="btn !py-2">Details</button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Card title="Near you">
            <div className="space-y-2.5">
              {incidents.slice(0, 4).map(i => (
                <div key={i.id} className="rounded-2xl border border-line p-3 transition-all hover:border-accent hover:-translate-y-0.5">
                  <div className="flex items-center justify-between"><b className="text-sm">{i.reason}</b><LevelChip level={i.level}>{i.level === 'closed' ? 'Closed' : `+${i.delayMin} min`}</LevelChip></div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-1"><MapPin size={12} /> {i.place}</div>
                  <div className="mt-2 flex items-center justify-between"><VerifyDots level={i.verification} /><Confidence value={i.confidence} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={<span className="flex items-center gap-2"><Camera size={16} className="text-accent" /> Report in one tap</span>}>
            <div className="grid grid-cols-2 gap-2">
              {kinds.map(k => (
                <button key={k.label} onClick={() => { setKind(k.label); setSent(false) }}
                  className={`btn !rounded-xl !justify-start ${kind === k.label ? '!border-accent !bg-accent-soft' : ''}`}>
                  <k.icon size={15} className="text-accent" /> {k.label}
                </button>
              ))}
            </div>
            <button className="btn w-full mt-3 !rounded-xl"><Camera size={15} /> Add photo / video</button>
            <button className="btn btn-primary w-full mt-2" disabled={!kind} onClick={() => setSent(true)}>Send report</button>
            <p className="text-[11px] text-muted mt-2">Your GPS location and time are attached automatically.</p>
            {sent && <p className="text-xs font-semibold text-t-free mt-1">✓ {kind} reported. Nearby users will confirm it.</p>}
          </Card>

          <button className="btn w-full !py-3 !bg-t-severe !border-t-severe !text-white hover:!shadow-[0_0_0_4px_rgb(239_68_68/0.3)]"><Phone size={16} /> SOS emergency</button>
          <div className="flex items-center gap-2 rounded-2xl bg-accent-soft p-3 text-xs"><Smartphone size={16} className="text-accent" /> The full commuter experience is coming in the mobile app.</div>
        </div>
      </div>
    </div>
  )
}
