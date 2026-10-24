import { useEffect, useRef, useState } from 'react'
import { AdvancedMarker, Map, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import type { TrafficMapProps } from './SvgTrafficMap'
import { MAP_ID } from './maps'
import { useIsDark } from './useIsDark'
import {
  employees as allEmployees, geo, hotspots as allHotspots, incidents as allIncidents,
  levelColor, levelLabel, MANGALURU, type LatLng,
} from '../data/mock'

/** Google's live traffic layer */
function Traffic() {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const layer = new google.maps.TrafficLayer()
    layer.setMap(map)
    return () => layer.setMap(null)
  }, [map])
  return null
}

function Polyline({ path, color, dashed, weight = 5 }: { path: LatLng[]; color: string; dashed?: boolean; weight?: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const line = new google.maps.Polyline({
      map, path, strokeColor: color, strokeOpacity: dashed ? 0 : 0.95, strokeWeight: weight, zIndex: 5,
      icons: dashed ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, scale: 3 }, offset: '0', repeat: '14px' }] : undefined,
    })
    return () => line.setMap(null)
  }, [map, path, color, dashed, weight])
  return null
}

function Heat({ center, days }: { center: LatLng; days: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const rings = [1, 0.6, 0.3].map((f, i) => new google.maps.Circle({
      map, center, radius: (350 + days * 40) * f, strokeOpacity: 0, fillColor: i === 2 ? '#ef4444' : '#f97316', fillOpacity: 0.16 + i * 0.08, clickable: false,
    }))
    return () => rings.forEach(r => r.setMap(null))
  }, [map, center, days])
  return null
}

/** Place search using Places API (New): autocomplete, then fly to the place. */
function PlaceSearch() {
  const map = useMap()
  const places = useMapsLibrary('places')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<google.maps.places.PlacePrediction[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [found, setFound] = useState<{ pos: LatLng; name: string } | null>(null)
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null)

  useEffect(() => {
    if (!places || q.trim().length < 2) { setItems([]); return }
    const t = setTimeout(async () => {
      token.current ??= new places.AutocompleteSessionToken()
      setBusy(true)
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q, sessionToken: token.current, includedRegionCodes: ['in'],
          locationBias: { center: MANGALURU, radius: 30000 },
        })
        setItems(suggestions.flatMap(s => (s.placePrediction ? [s.placePrediction] : [])).slice(0, 5))
        setErr(null)
      } catch {
        setErr('Search needs "Places API (New)" enabled for this key.')
      } finally { setBusy(false) }
    }, 220)
    return () => clearTimeout(t)
  }, [q, places])

  const pick = async (p: google.maps.places.PlacePrediction) => {
    const place = p.toPlace()
    await place.fetchFields({ fields: ['location', 'displayName', 'viewport'] })
    token.current = null
    setItems([])
    setQ(place.displayName ?? p.text.toString())
    if (!map || !place.location) return
    if (place.viewport) map.fitBounds(place.viewport)
    else { map.panTo(place.location); map.setZoom(15) }
    setFound({ pos: place.location.toJSON(), name: place.displayName ?? '' })
  }

  return (
    <>
      <div className="absolute left-3 top-3 z-10 w-[min(340px,calc(100%-5.5rem))]">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted pointer-events-none" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a place in Mangaluru"
            className="input !rounded-full !pl-9 !pr-9 !py-2 !bg-surface/95 backdrop-blur shadow-sm" />
          {busy ? <Loader2 size={15} className="z-10 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />
            : q && <button aria-label="Clear" onClick={() => { setQ(''); setItems([]); setFound(null) }} className="z-10 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink cursor-pointer"><X size={14} /></button>}
        </div>
        {(items.length > 0 || err) && (
          <ul className="mt-1.5 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
            {err && <li className="px-3.5 py-2.5 text-xs text-t-severe">{err}</li>}
            {items.map(p => (
              <li key={p.placeId}>
                <button onClick={() => pick(p)} className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-accent-soft cursor-pointer transition-colors">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                  <span><b className="font-semibold">{p.mainText?.toString()}</b><span className="block text-xs text-muted">{p.secondaryText?.toString()}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {found && (
        <AdvancedMarker position={found.pos} title={found.name} zIndex={50}>
          <Pin background="#ff6b1a" borderColor="#fff" glyphColor="#fff" />
        </AdvancedMarker>
      )}
    </>
  )
}

function IncidentDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="gm-incident" style={{ ['--c' as string]: color }} title={label}>
      <span className="gm-ring" />
      <span className="gm-core">!</span>
    </div>
  )
}

export default function GoogleTrafficMap({
  className = '', showIncidents = true, showEmployees = false, showHotspots = false,
  showRoute = false, showAltRoute = false, showLegend = true, search = true,
}: TrafficMapProps) {
  const dark = useIsDark()
  const incidents = showIncidents === true ? allIncidents : showIncidents || []
  const employees = showEmployees === true ? allEmployees : showEmployees || []
  const hotspots = showHotspots === true ? allHotspots : showHotspots || []

  return (
    <div className={`relative overflow-hidden rounded-[1.1rem] bg-surface-2 ${className}`}>
      <Map
        key={dark ? 'dark' : 'light'}
        mapId={MAP_ID}
        colorScheme={dark ? 'DARK' : 'LIGHT'}
        defaultCenter={MANGALURU}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        reuseMaps
        className="absolute inset-0"
      >
        <Traffic />
        {hotspots.map(h => geo.hotspots[h.place] && <Heat key={h.place} center={geo.hotspots[h.place]} days={h.days} />)}
        {showAltRoute && <Polyline path={geo.altRoute} color="#2bb3a3" dashed />}
        {showRoute && <>
          <Polyline path={geo.route} color="#ff6b1a" weight={9} />
          <AdvancedMarker position={geo.home} title="Home"><span className="gm-dot" /></AdvancedMarker>
          <AdvancedMarker position={geo.office} title="Office"><Pin background="#ff6b1a" borderColor="#fff" glyphColor="#fff" /></AdvancedMarker>
        </>}
        {incidents.map(i => {
          const pos = geo.incidents[i.id] ?? (i.lat != null && i.lng != null ? { lat: i.lat, lng: i.lng } : null)
          return pos && (
            <AdvancedMarker key={i.id} position={pos} title={`${i.reason} at ${i.place}: +${i.delayMin} min, ${i.confidence}% confidence`} zIndex={20}>
              <IncidentDot color={levelColor[i.level]} label={i.reason} />
            </AdvancedMarker>
          )
        })}
        {employees.map(e => {
          const pos = geo.employees[e.initials]
          if (!pos) return null
          const c = e.status === 'Delayed' ? '#ef4444' : e.status === 'Not started' ? '#8b847a' : '#22c55e'
          return (
            <AdvancedMarker key={e.name} position={pos} title={`${e.name}: ${e.status}${e.delayMin ? ` (+${e.delayMin} min)` : ''}`} zIndex={30}>
              <span className="gm-avatar" style={{ borderColor: c }}>{e.initials}</span>
            </AdvancedMarker>
          )
        })}
        {search && <PlaceSearch />}
      </Map>

      {showLegend && (
        <div className="absolute left-3 bottom-3 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-surface/90 px-3 py-2 text-[11px] font-semibold backdrop-blur border border-line">
          {(Object.keys(levelColor) as (keyof typeof levelColor)[]).map(l => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full" style={{ background: levelColor[l], outline: l === 'closed' ? '1px solid var(--muted)' : undefined }} />
              {levelLabel[l]}
            </span>
          ))}
          <span className="text-muted font-medium">· live traffic by Google</span>
        </div>
      )}
    </div>
  )
}
