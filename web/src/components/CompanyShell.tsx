import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronDown, LogOut, Search, type LucideIcon } from 'lucide-react'
import Logo from './Logo'
import NotificationsBell from './NotificationsBell'
import { notify } from './toast'
import { ThemeToggle, type Mode } from './theme'

export type NavItem = { id: string; label: string; icon: LucideIcon }

/** Company dashboard shell: full-width header, permanent left sidebar, content on the right. */
export default function CompanyShell({
  nav, active, onNav, onSearch, company, user, theme, children,
}: {
  /** header search: Enter (or the phone search button) opens Status with the query */
  onSearch: (q: string) => void
  nav: NavItem[]
  active: string
  onNav: (id: string) => void
  company: string
  user: { initials: string; name: string }
  theme: { mode: Mode; toggle: () => void }
  children: ReactNode
}) {
  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="rounded-[1.75rem] bg-surface-2/60 dark:bg-[#171717] border border-line overflow-hidden">
        <header className="flex items-center gap-1.5 sm:gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
          <Logo sub="Company dashboard" />
          <label className="relative ml-auto hidden md:block w-56 lg:w-80">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !py-2 !pl-10 !rounded-full text-sm" placeholder="Search employees, routes…" aria-label="Search"
              onKeyDown={e => { if (e.key === 'Enter') onSearch(e.currentTarget.value.trim()) }} />
          </label>
          <button className="btn btn-icon ml-auto md:hidden" aria-label="Search" onClick={() => onSearch('')}><Search size={16} /></button>
          <button className="btn !py-2 text-[13px] hidden sm:inline-flex" title="Company account" onClick={() => notify(`Signed in to ${company}. This account has no other companies.`)}>
            <Building2 size={15} className="text-olive" /><span className="max-w-[9rem] truncate">{company}</span><ChevronDown size={14} className="text-muted" />
          </button>
          <NotificationsBell />
          <ThemeToggle {...theme} />
          <span title={user.name} className="hidden sm:grid place-items-center size-9 shrink-0 rounded-full bg-accent text-white font-bold text-sm">{user.initials}</span>
          <Link to="/" className="btn btn-icon" aria-label="Log out"><LogOut size={16} /></Link>
        </header>

        <div className="flex flex-col md:flex-row">
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto border-b md:border-b-0 md:border-r border-line p-3 md:w-56 md:shrink-0 md:min-h-[calc(100vh-7rem)]">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onNav(id)} aria-current={active === id ? 'page' : undefined}
                className={`btn shrink-0 whitespace-nowrap md:w-full md:!justify-start !py-2.5 text-[13px] ${active === id ? 'pill-active' : '!bg-transparent !border-transparent hover:!bg-surface-2'}`}>
                <Icon size={17} />{label}
              </button>
            ))}
          </nav>
          <main className="min-w-0 flex-1 p-3 sm:p-5">{children}</main>
        </div>
      </div>
    </div>
  )
}
