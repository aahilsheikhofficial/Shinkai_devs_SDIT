import { Link } from 'react-router-dom'

export default function Logo({ sub }: { sub?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group" title="Back to start">
      <span className="grid place-items-center size-9 rounded-xl bg-accent text-white shadow-sm transition-transform group-hover:-rotate-6">
        <svg viewBox="0 0 32 32" className="size-5"><path d="M9 23 16 7l7 16-7-4z" fill="currentColor" /></svg>
      </span>
      <span className="leading-tight">
        <span className="block font-extrabold tracking-tight text-[1.05rem]">TrafficSense</span>
        {sub && <span className="block text-[11px] font-medium text-muted -mt-0.5">{sub}</span>}
      </span>
    </Link>
  )
}
