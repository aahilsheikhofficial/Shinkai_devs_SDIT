import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock, Mail } from 'lucide-react'
import Logo from '../components/Logo'
import { ThemeToggle, useThemeMode } from '../components/theme'
import { domainById, type DomainId } from '../data/domains'

const audience: Record<DomainId, string> = {
  commuter: 'commuters',
  employee: 'employees',
  company: 'companies',
  gov: 'traffic authorities',
}

const idLabel: Record<DomainId, string> = {
  commuter: 'Phone or email',
  employee: 'Work email',
  company: 'Company admin email',
  gov: 'Department ID',
}

export default function Login() {
  const { domain } = useParams()
  const d = domain && domain in domainById ? domainById[domain as DomainId] : null
  const theme = useThemeMode(d?.id === 'company' || d?.id === 'gov' ? d.id : 'landing', d?.id === 'company' || d?.id === 'gov' ? 'dark' : 'light')
  const navigate = useNavigate()
  if (!d) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Only this domain's artwork is shown */}
      <div className="relative hidden lg:block">
        <img src={d.art} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <span className="chip bg-accent text-white">{d.title}</span>
          <p className="mt-3 text-2xl font-bold leading-snug max-w-md">{d.blurb}</p>
        </div>
      </div>

      <div className="flex flex-col px-6 sm:px-12 py-6">
        <div className="flex items-center justify-between">
          <Logo sub={`${d.title} portal`} />
          <ThemeToggle {...theme} />
        </div>
        <img src={d.art} alt="" className="lg:hidden mt-6 rounded-2xl aspect-[16/9] object-cover" />

        <form
          className="my-auto w-full max-w-sm mx-auto py-10"
          onSubmit={e => { e.preventDefault(); navigate(d.home) }}
        >
          <Link to="/" className="btn btn-ghost !px-2 -ml-2 text-muted"><ArrowLeft size={15} /> Change role</Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted mt-1">Welcome back to TrafficSense for {audience[d.id]}.</p>

          <label className="block mt-7 text-xs font-semibold text-muted">{idLabel[d.id]}</label>
          <div className="relative mt-1.5">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !pl-10" defaultValue={d.id === 'gov' ? 'MNG-TRF-0421' : 'demo@trafficsense.in'} />
          </div>
          <label className="block mt-4 text-xs font-semibold text-muted">Password</label>
          <div className="relative mt-1.5">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !pl-10" type="password" defaultValue="demo1234" />
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <label className="flex items-center gap-2 text-muted"><input type="checkbox" defaultChecked className="accent-[var(--accent)]" /> Remember me</label>
            <a className="font-semibold text-accent hover:underline" href="#">Forgot password?</a>
          </div>
          <button className="btn btn-primary w-full mt-6 !py-3">Sign in <ArrowRight size={16} /></button>
          <p className="mt-4 text-center text-xs text-muted">Demo mode: any details work.</p>
        </form>
      </div>
    </div>
  )
}
