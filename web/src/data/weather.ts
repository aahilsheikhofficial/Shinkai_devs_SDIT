import { useEffect, useState } from 'react'
import { MANGALURU } from './mock'

// Live weather from Open-Meteo (free, no key). Cached for 30 min; falls back to sample data offline.

export type DayForecast = { date: string; day: string; rainMm: number; chance: number; code: number; risk: 'Low' | 'Medium' | 'High' }
export type Weather = {
  live: boolean
  tempC: number
  rainNowMm: number
  windKmh: number
  code: number
  label: string
  rainNext3h: number
  chanceNext3h: number
  days: DayForecast[]
}

const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${MANGALURU.lat}&longitude=${MANGALURU.lng}` +
  '&current=temperature_2m,precipitation,weather_code,wind_speed_10m' +
  '&hourly=precipitation,precipitation_probability' +
  '&daily=precipitation_sum,precipitation_probability_max,weather_code' +
  '&timezone=Asia%2FKolkata&forecast_days=5'
const TTL = 30 * 60 * 1000
const CACHE_KEY = 'ts-weather-v1'

export function weatherLabel(code: number) {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Cloudy'
  if (code <= 48) return 'Fog'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 82) return 'Rain showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Cloudy'
}

export function riskFor(rainMm: number, chance: number): DayForecast['risk'] {
  if (rainMm >= 20 || (rainMm >= 10 && chance >= 70)) return 'High'
  if (rainMm >= 5 || chance >= 50) return 'Medium'
  return 'Low'
}

const dayName = (iso: string, i: number) => (i === 0 ? 'Today' : new Date(iso + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short' }))

const sample: Weather = {
  live: false, tempC: 27, rainNowMm: 2.4, windKmh: 14, code: 63, label: 'Rain', rainNext3h: 9, chanceNext3h: 80,
  days: [
    { rain: 6, chance: 55, code: 61 }, { rain: 14, chance: 70, code: 63 }, { rain: 32, chance: 90, code: 65 },
    { rain: 28, chance: 85, code: 82 }, { rain: 8, chance: 50, code: 61 },
  ].map((d, i) => {
    const date = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10)
    return { date, day: dayName(date, i), rainMm: d.rain, chance: d.chance, code: d.code, risk: riskFor(d.rain, d.chance) }
  }),
}

type Raw = {
  current: { temperature_2m: number; precipitation: number; weather_code: number; wind_speed_10m: number; time: string }
  hourly: { time: string[]; precipitation: number[]; precipitation_probability: number[] }
  daily: { time: string[]; precipitation_sum: number[]; precipitation_probability_max: number[]; weather_code: number[] }
}

function parse(r: Raw): Weather {
  const now = r.hourly.time.findIndex(t => t >= r.current.time.slice(0, 13))
  const from = Math.max(0, now)
  const next = r.hourly.precipitation.slice(from, from + 3)
  const nextP = r.hourly.precipitation_probability.slice(from, from + 3)
  return {
    live: true,
    tempC: Math.round(r.current.temperature_2m),
    rainNowMm: r.current.precipitation,
    windKmh: Math.round(r.current.wind_speed_10m),
    code: r.current.weather_code,
    label: weatherLabel(r.current.weather_code),
    rainNext3h: +next.reduce((a, b) => a + b, 0).toFixed(1),
    chanceNext3h: Math.max(0, ...nextP),
    days: r.daily.time.map((date, i) => {
      const rainMm = +r.daily.precipitation_sum[i].toFixed(1)
      const chance = r.daily.precipitation_probability_max[i] ?? 0
      return { date, day: dayName(date, i), rainMm, chance, code: r.daily.weather_code[i], risk: riskFor(rainMm, chance) }
    }),
  }
}

let memo: { at: number; data: Weather } | null = null
let inflight: Promise<Weather> | null = null

function load(): Promise<Weather> {
  if (memo && Date.now() - memo.at < TTL) return Promise.resolve(memo.data)
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (c && Date.now() - c.at < TTL) { memo = c; return Promise.resolve(c.data) }
  } catch { /* storage blocked */ }
  inflight ??= fetch(URL)
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((raw: Raw) => {
      const data = parse(raw)
      memo = { at: Date.now(), data }
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(memo)) } catch { /* storage blocked */ }
      return data
    })
    .catch(() => sample)
    .finally(() => { inflight = null })
  return inflight
}

/** Shared weather for Mangaluru. Returns sample data until the live data arrives. */
export function useWeather() {
  const [w, setW] = useState<Weather>(() => (memo && Date.now() - memo.at < TTL ? memo.data : sample))
  useEffect(() => { let on = true; load().then(d => on && setW(d)); return () => { on = false } }, [])
  return w
}

// Start fetching as soon as the app loads
load()
