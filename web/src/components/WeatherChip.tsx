import { Cloud, CloudDrizzle, CloudLightning, CloudRain, Sun } from 'lucide-react'
import { useWeather } from '../data/weather'

export function WeatherIcon({ code, size = 16, className = '' }: { code: number; size?: number; className?: string }) {
  const I = code === 0 ? Sun : code >= 95 ? CloudLightning : code >= 61 ? CloudRain : code >= 51 ? CloudDrizzle : Cloud
  return <I size={size} className={className} />
}

/** Compact live weather pill for headers */
export default function WeatherChip() {
  const w = useWeather()
  return (
    <span className="btn !cursor-default !py-2" title={w.live ? 'Live weather, Open-Meteo' : 'Sample weather (offline)'}>
      <WeatherIcon code={w.code} className={w.code >= 51 ? 'text-teal' : 'text-t-moderate'} />
      {w.tempC}°<span className="hidden 2xl:inline"> · {w.label}</span>
    </span>
  )
}

/** Warns when rain is expected in the next 3 hours */
export function RainWarning({ where = 'your route' }: { where?: string }) {
  const w = useWeather()
  if (w.rainNext3h < 2 && w.chanceNext3h < 60) return null
  const heavy = w.rainNext3h >= 7
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 text-sm ${heavy ? 'border-t-severe/40 bg-t-severe/10' : 'border-teal/40 bg-teal/10'}`}>
      <CloudRain size={18} className={heavy ? 'text-t-severe' : 'text-teal'} />
      <span><b>{heavy ? 'Heavy rain' : 'Rain'} expected on {where}</b> · {w.rainNext3h} mm in the next 3 h ({w.chanceNext3h}% chance). Leave 10–15 min early; Ullal Road floods first.</span>
    </div>
  )
}
