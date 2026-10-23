import { Briefcase, Building2, Car, Landmark, type LucideIcon } from 'lucide-react'

export type DomainId = 'commuter' | 'employee' | 'company' | 'gov'

export type Domain = {
  id: DomainId
  title: string
  who: string
  blurb: string
  art: string
  home: string
  icon: LucideIcon
  points: string[]
}

export const domains: Domain[] = [
  {
    id: 'commuter', title: 'Commuter', who: 'I travel around the city',
    blurb: 'See why a road is blocked, get a better route, and report what you see in one tap.',
    art: '/artwork/commuter.webp', home: '/commuter', icon: Car,
    points: ['Live traffic with the reason', 'Alternate route alerts', 'One-tap incident report + SOS'],
  },
  {
    id: 'employee', title: 'Employee', who: 'I commute to work',
    blurb: 'Your commute, its delays and the proof behind them, shared with your company only during work travel.',
    art: '/artwork/employee.webp', home: '/employee', icon: Briefcase,
    points: ['Commute tracking only when you start', 'Auto-verified late arrivals', 'Route alerts before you leave'],
  },
  {
    id: 'company', title: 'Company', who: 'I manage a team',
    blurb: 'Know who is stuck, why, and for how long, before anyone has to call in.',
    art: '/artwork/company.webp', home: '/company', icon: Building2,
    points: ['Live employee travel board', 'Verified delay evidence', 'Monsoon risk forecast'],
  },
  {
    id: 'gov', title: 'Government', who: 'I work for a traffic authority',
    blurb: 'Verified incidents, recurring hotspots and evidence reports that point to permanent fixes.',
    art: '/artwork/government.webp', home: '/gov', icon: Landmark,
    points: ['Live verified incident feed', 'Recurring hotspot analysis', 'Agency referrals + reports'],
  },
]

export const domainById = Object.fromEntries(domains.map(d => [d.id, d])) as Record<DomainId, Domain>
