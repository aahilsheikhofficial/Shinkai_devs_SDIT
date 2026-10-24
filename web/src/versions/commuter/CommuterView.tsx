import { useRef, useState } from 'react'
import { sendReport, useIncidents } from '../../data/api'
import { notify } from '../../components/toast'
import { Link } from 'react-router-dom'
import { AlertTriangle, Camera, CarFront, CloudRain, Construction, LogOut, MapPin, Navigation, Phone, Search, Smartphone, TrafficCone } from 'lucide-react'
import Logo from '../../components/Logo'
import TrafficMap from '../../components/TrafficMap'
import { ThemeToggle, useThemeMode } from '../../components/theme'
import { Card, Confidence, LevelChip, VerifyDots } from '../../components/ui'
import { verificationSteps } from '../../data/mock'
import WeatherChip, { RainWarning } from '../../components/WeatherChip'

const kinds = [
  { label: 'Accident', icon: CarFront },
  { label: 'Road repair', icon: Construction },
  { label: 'Flood / rain', icon: CloudRain },
  { label: 'Signal down', icon: TrafficCone },
]

export default function CommuterView() {
  const theme = useThemeMode('commuter', 'light')
  const [kind, setKind] = useState<string | null>(null)
  const [sent, setSent] = useState<string | false>(false)
  const [busy, setBusy] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [avoid, setAvoid] = useState(false)
  const [details, setDetails] = useState(false)
  const [q, setQ] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const { data: incidents } = useIncidents()
  const top = incidents[0]
  const near = incidents.filter(i => !q.trim() || q.toLowerCase().split(/[^a-z]+/).some(w => w.length > 2 && i.place.toLowerCase().includes(w)))
  const send = async () => {
    if (!kind) return
    setBusy(true)
    try {
      const r = await sendReport(kind === 'Flood / rain' ? 'Flood' : kind === 'Signal down' ? 'Signal failure' : kind, { hasPhoto: !!photo, reporter: 'commuter' })
      setSent(`${r.incident.id} · ${r.merged ? 'added to an existing report' : 'new report'} · verification L${r.incident.verification}${r.realLocation ? '' : ' (location blocked, city centre used)'}`)
      setPhoto(null)
    } catch (e) { notify((e as Error).message, false) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <Logo sub="Commuter" />
        <div className="relative flex-1 min-w-[200px] max-w-md mx-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !rounded-full !pl-10" defaultValue="Ullal → Hampankatta" onKeyDown={e => { if (e.key === 'Enter') setQ(e.currentTarget.value) }} onBlur={e => setQ(e.currentTarget.value)} aria-label="Search your route" />
        </div>
        <WeatherChip />
        <ThemeToggle {...theme} />
        <Link to="/" className="btn btn-icon" aria-label="Log out"><LogOut size={16} /></Link>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="card relative p-3">
          <TrafficMap className="h-[calc(100vh-150px)] min-h-[480px]" showIncidents={incidents} showRoute={!avoid} showAltRoute />
          <div className="absolute left-6 top-[4.25rem] right-20 sm:right-auto sm:max-w-sm card p-4 z-10">
            <div className="flex items-center gap-2 text-sm font-bold"><AlertTriangle size={16} className="text-t-severe" /> Accident ahead at Pumpwell</div>
            <p className="text-xs text-muted mt-1">+32 min · 14 people reported · verified by GPS speed (2 km/h for 30 min)</p>
            {details && top && <ol className="mt-2 space-y-0.5 text-[11px]">{verificationSteps.map((st, n) => <li key={st} className={n < top.verification ? 'font-semibold' : 'text-muted'}>{n < top.verification ? '✓' : '○'} {st}</li>)}</ol>}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary !py-2 flex-1" onClick={() => { setAvoid(a => !a); notify(avoid ? 'Back on your usual route.' : 'Showing the alternative route only.') }}><Navigation size={15} /> {avoid ? 'Avoiding (undo)' : 'Avoid (−14 min)'}</button>
              <button className="btn !py-2" onClick={() => setDetails(d => !d)}>Details</button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <RainWarning where="your way" />
          <Card title="Near you">
            <div className="space-y-2.5">
              {near.slice(0, 4).map(i => (
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
            <input ref={file} type="file" accept="image/*,video/*" capture="environment" hidden onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            <button className="btn w-full mt-3 !rounded-xl" onClick={() => file.current?.click()}><Camera size={15} /> {photo ? `Attached: ${photo.name.slice(0, 24)}` : 'Add photo / video'}</button>
            <button className="btn btn-primary w-full mt-2" disabled={!kind || busy} onClick={send}>{busy ? 'Sending…' : 'Send report'}</button>
            <p className="text-[11px] text-muted mt-2">Your GPS location and time are attached automatically.</p>
            {sent && <p className="text-xs font-semibold text-t-free mt-1">✓ {kind} reported ({sent}). Nearby users will confirm it.</p>}
          </Card>

          <a href="tel:112" className="btn w-full !py-3 !bg-t-severe !border-t-severe !text-white hover:!shadow-[0_0_0_4px_rgb(239_68_68/0.3)]"><Phone size={16} /> SOS emergency</a>
          <div className="flex items-center gap-2 rounded-2xl bg-accent-soft p-3 text-xs"><Smartphone size={16} className="text-accent" /> The full commuter experience is coming in the mobile app.</div>
        </div>
      </div>
    </div>
  )
}
