import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LogOut, Search } from 'lucide-react'
import Logo from './Logo'
import { ThemeToggle, type Mode } from './theme'

/** Vexora-style "control room" shell shared by Company and Government. */
export default function ControlShell({
  sub, tabs, active, onTab, user, cta, theme, children,
}: {
  sub: string
  tabs: string[]
  active: string
  onTab: (t: string) => void
  user: { initials: string; name: string }
  cta: ReactNode
  theme: { mode: Mode; toggle: () => void }
  children: ReactNode
}) {
  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="rounded-[1.75rem] bg-surface-2/60 dark:bg-[#171717] border border-line p-4 sm:p-5">
        <header className="flex flex-wrap items-center gap-3 mb-5">
          <Logo sub={sub} />
          <nav className="flex flex-wrap gap-1.5 ml-2 lg:ml-6 order-3 lg:order-none w-full lg:w-auto">
            {tabs.map(t => (
              <button key={t} onClick={() => onTab(t)} className={`btn !py-2 ${active === t ? 'pill-active' : '!bg-surface-2'}`}>{t}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn btn-icon" aria-label="Search"><Search size={16} /></button>
            {cta}
            <button className="btn btn-icon relative" aria-label="Notifications"><Bell size={16} /><span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-t-severe" /></button>
            <ThemeToggle {...theme} />
            <span title={user.name} className="grid place-items-center size-10 rounded-full bg-accent text-white font-bold text-sm">{user.initials}</span>
            <Link to="/" className="btn btn-icon" aria-label="Log out"><LogOut size={16} /></Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
