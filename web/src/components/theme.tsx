import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export type Mode = 'light' | 'dark'

/** Each version picks its own default mode; the toggle remembers the choice per version. */
export function useThemeMode(key: string, fallback: Mode) {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const saved = localStorage.getItem(`ts-theme-${key}`)
      if (saved === 'light' || saved === 'dark') return saved
    } catch { /* storage blocked */ }
    return fallback
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    try { localStorage.setItem(`ts-theme-${key}`, mode) } catch { /* storage blocked */ }
  }, [key, mode])
  return { mode, toggle: () => setMode(m => (m === 'dark' ? 'light' : 'dark')) }
}

export function ThemeToggle({ mode, toggle }: { mode: Mode; toggle: () => void }) {
  return (
    <button className="btn btn-icon" onClick={toggle} aria-label="Toggle light or dark mode" title="Toggle theme">
      {mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
