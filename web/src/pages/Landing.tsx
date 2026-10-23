import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import Logo from '../components/Logo'
import { ThemeToggle, useThemeMode } from '../components/theme'
import { domains, type DomainId } from '../data/domains'

export default function Landing() {
  const theme = useThemeMode('landing', 'light')
  const navigate = useNavigate()
  const [picked, setPicked] = useState<DomainId | null>(null)
  const [preview, setPreview] = useState<DomainId>('commuter')
  const shown = domains.find(d => d.id === (picked ?? preview))!

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 lg:px-10 py-5">
        <Logo sub="Report · Verify · Alert · Analyse" />
        <ThemeToggle {...theme} />
      </header>

      <main className="flex-1 grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 px-6 lg:px-10 pb-10 items-center">
        <div className="max-w-xl">
          <span className="chip bg-accent-soft text-accent">Mangaluru · Udupi pilot</span>
          <h1 className="mt-4 text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05]">
            Who are <span className="text-accent">you?</span>
          </h1>
          <p className="mt-3 text-muted text-[15px] leading-relaxed">
            TrafficSense tells you <b className="text-ink">why</b> a road is blocked, not just that it is. Pick your role and we’ll show you the view built for you.
          </p>

          <div className="mt-7 grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Choose your role">
            {domains.map(d => {
              const on = picked === d.id
              const Icon = d.icon
              return (
                <button
                  key={d.id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPicked(d.id)}
                  onMouseEnter={() => setPreview(d.id)}
                  onFocus={() => setPreview(d.id)}
                  className={`group relative text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer
                    hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_20%,transparent)]
                    ${on ? 'border-accent bg-accent-soft shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)]' : 'border-line bg-surface'}`}
                >
                  <span className={`grid place-items-center size-10 rounded-xl transition-colors ${on ? 'bg-accent text-white' : 'bg-surface-2 text-ink group-hover:bg-accent group-hover:text-white'}`}>
                    <Icon size={19} />
                  </span>
                  <span className="mt-3 block font-bold">{d.title}</span>
                  <span className="block text-[13px] text-muted">{d.who}</span>
                  {on && <span className="absolute right-3 top-3 grid place-items-center size-6 rounded-full bg-accent text-white"><Check size={14} /></span>}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              className="btn btn-primary !px-6 !py-3 disabled:opacity-40 disabled:pointer-events-none"
              disabled={!picked}
              onClick={() => picked && navigate(`/login/${picked}`)}
            >
              Continue as {picked ? domains.find(d => d.id === picked)!.title : '…'} <ArrowRight size={16} />
            </button>
            <span className="text-xs text-muted">The mobile app comes next.</span>
          </div>
        </div>

        <div className="relative">
          <div key={shown.id} className="fade-in card overflow-hidden !rounded-[1.75rem]">
            <img src={shown.art} alt={`${shown.title} illustration`} className="w-full aspect-[4/3] object-cover" />
            <div className="p-5">
              <div className="font-bold">{shown.title}</div>
              <p className="text-sm text-muted mt-1">{shown.blurb}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {shown.points.map(p => <li key={p} className="chip bg-surface-2 text-ink">{p}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
