// Dummy data for the judge demo. Everything here gets replaced by the FastAPI backend later.

export type Level = 'free' | 'moderate' | 'heavy' | 'severe' | 'closed'

export const levelColor: Record<Level, string> = {
  free: '#22c55e',
  moderate: '#eab308',
  heavy: '#f97316',
  severe: '#ef4444',
  closed: '#0a0a0a',
}
export const levelLabel: Record<Level, string> = {
  free: 'Normal',
  moderate: 'Moderate',
  heavy: 'Heavy',
  severe: 'Severe',
  closed: 'Closed',
}

export type Place = { id: string; name: string; x: number; y: number }
export const places: Record<string, Place> = {
  surathkal: { id: 'surathkal', name: 'Surathkal', x: 330, y: 30 },
  kulur: { id: 'kulur', name: 'Kulur', x: 372, y: 118 },
  kottara: { id: 'kottara', name: 'Kottara Chowki', x: 392, y: 172 },
  lalbagh: { id: 'lalbagh', name: 'Lalbagh', x: 330, y: 228 },
  nanthoor: { id: 'nanthoor', name: 'Nanthoor', x: 470, y: 250 },
  hampankatta: { id: 'hampankatta', name: 'Hampankatta', x: 290, y: 300 },
  kankanady: { id: 'kankanady', name: 'Kankanady', x: 360, y: 335 },
  bikarnakatte: { id: 'bikarnakatte', name: 'Bikarnakatte', x: 520, y: 305 },
  pumpwell: { id: 'pumpwell', name: 'Pumpwell', x: 425, y: 382 },
  padil: { id: 'padil', name: 'Padil', x: 575, y: 365 },
  thokkotu: { id: 'thokkotu', name: 'Thokkotu', x: 405, y: 492 },
  ullal: { id: 'ullal', name: 'Ullal', x: 285, y: 515 },
  office: { id: 'office', name: 'TechPark (Office)', x: 690, y: 345 },
}

export type Segment = { id: string; name: string; path: string; level: Level; major?: boolean }
export const segments: Segment[] = [
  { id: 'nh66-n', name: 'NH-66 Surathkal–Kulur', path: 'M340 -10 L355 60 L372 118', level: 'free', major: true },
  { id: 'nh66-kulur', name: 'NH-66 Kulur–Kottara', path: 'M372 118 L392 172', level: 'moderate', major: true },
  { id: 'nh66-kottara', name: 'NH-66 Kottara–Nanthoor', path: 'M392 172 L430 210 L470 250', level: 'moderate', major: true },
  { id: 'nh66-nanthoor', name: 'NH-66 Nanthoor–Pumpwell', path: 'M470 250 L452 320 L425 382', level: 'heavy', major: true },
  { id: 'nh66-pumpwell', name: 'NH-66 Pumpwell–Thokkotu', path: 'M425 382 L415 440 L405 492', level: 'severe', major: true },
  { id: 'nh66-s', name: 'NH-66 Thokkotu–Talapady', path: 'M405 492 L395 580', level: 'heavy', major: true },
  { id: 'nh73', name: 'NH-73 Pumpwell–Padil', path: 'M425 382 L500 372 L575 365', level: 'heavy', major: true },
  { id: 'nh73-e', name: 'NH-73 Padil–TechPark', path: 'M575 365 L690 345 L820 330', level: 'free', major: true },
  { id: 'city-1', name: 'Hampankatta–Kankanady', path: 'M290 300 L360 335 L425 382', level: 'moderate' },
  { id: 'city-2', name: 'Lalbagh–Hampankatta', path: 'M392 172 L330 228 L290 300', level: 'free' },
  { id: 'city-3', name: 'Nanthoor–Bikarnakatte–Padil', path: 'M470 250 L520 305 L575 365', level: 'free' },
  { id: 'city-4', name: 'Ullal Road', path: 'M405 492 L340 505 L285 515', level: 'closed' },
  { id: 'city-5', name: 'Kankanady–Bikarnakatte', path: 'M360 335 L440 315 L520 305', level: 'free' },
]

export type Reason =
  | 'Accident' | 'Road repair' | 'Festival' | 'VIP movement' | 'Heavy rain'
  | 'Flood' | 'Signal failure' | 'Breakdown' | 'Closure' | 'Strike'

export type Incident = {
  id: string
  reason: Reason
  place: string
  x: number
  y: number
  level: Level
  delayMin: number
  confidence: number
  verification: 1 | 2 | 3 | 4 | 5 | 6
  reports: number
  since: string
  agency?: string
}

export const incidents: Incident[] = [
  { id: 'INC-2041', reason: 'Accident', place: 'Pumpwell flyover', x: 425, y: 382, level: 'severe', delayMin: 32, confidence: 92, verification: 5, reports: 14, since: '08:12', agency: 'Traffic Police' },
  { id: 'INC-2042', reason: 'Road repair', place: 'Thokkotu junction', x: 410, y: 462, level: 'heavy', delayMin: 18, confidence: 84, verification: 4, reports: 7, since: '07:40', agency: 'NHAI' },
  { id: 'INC-2043', reason: 'Flood', place: 'Ullal Road', x: 330, y: 507, level: 'closed', delayMin: 45, confidence: 96, verification: 6, reports: 22, since: '06:55', agency: 'MCC' },
  { id: 'INC-2044', reason: 'Signal failure', place: 'Nanthoor circle', x: 462, y: 282, level: 'heavy', delayMin: 11, confidence: 71, verification: 3, reports: 5, since: '08:31', agency: 'MESCOM' },
  { id: 'INC-2045', reason: 'Breakdown', place: 'Kulur bridge', x: 380, y: 142, level: 'moderate', delayMin: 6, confidence: 58, verification: 2, reports: 2, since: '08:44' },
]

export const verificationSteps = [
  'User report',
  'GPS location',
  'Multiple users',
  'GPS speed confirms',
  'Photo / video',
  'Authority confirmed',
]

export type Employee = {
  name: string
  initials: string
  route: string
  status: 'On time' | 'Delayed' | 'At office' | 'Not started'
  delayMin: number
  reason?: Reason
  verified?: boolean
  x: number
  y: number
}

export const employees: Employee[] = [
  { name: 'Aahil Sheikh', initials: 'AS', route: 'Ullal → TechPark', status: 'Delayed', delayMin: 32, reason: 'Accident', verified: true, x: 418, y: 420 },
  { name: 'Madiha K', initials: 'MK', route: 'Thokkotu → TechPark', status: 'Delayed', delayMin: 18, reason: 'Road repair', verified: true, x: 408, y: 470 },
  { name: 'Gautam R', initials: 'GR', route: 'Surathkal → TechPark', status: 'On time', delayMin: 0, x: 440, y: 222 },
  { name: 'Mohammed Safaf', initials: 'MS', route: 'Hampankatta → TechPark', status: 'At office', delayMin: 0, x: 690, y: 345 },
  { name: 'Priya Shetty', initials: 'PS', route: 'Kankanady → TechPark', status: 'Delayed', delayMin: 11, reason: 'Signal failure', verified: false, x: 470, y: 312 },
  { name: 'Rohan D’Souza', initials: 'RD', route: 'Padil → TechPark', status: 'On time', delayMin: 0, x: 610, y: 360 },
  { name: 'Ananya Rao', initials: 'AR', route: 'Kulur → TechPark', status: 'Not started', delayMin: 0, x: 352, y: 72 },
]

export const weekCommute = [
  { day: 'Mon', minutes: 34, usual: 30 },
  { day: 'Tue', minutes: 31, usual: 30 },
  { day: 'Wed', minutes: 52, usual: 30 },
  { day: 'Thu', minutes: 38, usual: 30 },
  { day: 'Fri', minutes: 29, usual: 30 },
  { day: 'Sat', minutes: 27, usual: 30 },
  { day: 'Today', minutes: 62, usual: 30 },
]

export const delayCauses = [
  { name: 'Accident', value: 38, color: '#ff6b1a' },
  { name: 'Road repair', value: 24, color: '#eab308' },
  { name: 'Heavy rain', value: 21, color: '#2bb3a3' },
  { name: 'Signal failure', value: 11, color: '#9aa23a' },
  { name: 'Other', value: 6, color: '#8b847a' },
]

export const lateArrivals = [
  { day: 'Mon', late: 4, justified: 3 },
  { day: 'Tue', late: 2, justified: 2 },
  { day: 'Wed', late: 9, justified: 8 },
  { day: 'Thu', late: 5, justified: 3 },
  { day: 'Fri', late: 3, justified: 3 },
  { day: 'Sat', late: 1, justified: 1 },
  { day: 'Today', late: 3, justified: 2 },
]

export const monsoonRisk = [
  { day: 'Fri', rain: 12, risk: 'Low' },
  { day: 'Sat', rain: 38, risk: 'Medium' },
  { day: 'Sun', rain: 74, risk: 'High' },
  { day: 'Mon', rain: 81, risk: 'High' },
  { day: 'Tue', rain: 46, risk: 'Medium' },
]

export const monthlyByReason = [
  { month: 'May', accident: 42, repair: 30, rain: 12, other: 18 },
  { month: 'Jun', accident: 48, repair: 22, rain: 61, other: 20 },
  { month: 'Jul', accident: 51, repair: 18, rain: 88, other: 24 },
  { month: 'Aug', accident: 46, repair: 26, rain: 70, other: 19 },
  { month: 'Sep', accident: 39, repair: 41, rain: 35, other: 22 },
  { month: 'Oct', accident: 44, repair: 37, rain: 20, other: 25 },
]

export const hoursLost = [
  { h: '6a', v: 40 }, { h: '7a', v: 120 }, { h: '8a', v: 410 }, { h: '9a', v: 380 },
  { h: '10a', v: 150 }, { h: '12p', v: 90 }, { h: '2p', v: 110 }, { h: '4p', v: 180 },
  { h: '5p', v: 360 }, { h: '6p', v: 450 }, { h: '7p', v: 260 }, { h: '9p', v: 70 },
]

export type Hotspot = { place: string; x: number; y: number; days: number; mainCause: Reason; hoursLost: number; suggestion: string }
export const hotspots: Hotspot[] = [
  { place: 'Pumpwell junction', x: 425, y: 382, days: 18, mainCause: 'Accident', hoursLost: 1240, suggestion: 'Signal re-timing study + grade-separated U-turn' },
  { place: 'Thokkotu junction', x: 408, y: 480, days: 15, mainCause: 'Road repair', hoursLost: 860, suggestion: 'Fast-track NHAI service-road completion' },
  { place: 'Nanthoor circle', x: 470, y: 255, days: 12, mainCause: 'Signal failure', hoursLost: 540, suggestion: 'Replace controller, add battery backup' },
  { place: 'Ullal Road dip', x: 320, y: 508, days: 9, mainCause: 'Flood', hoursLost: 610, suggestion: 'Drainage audit before next monsoon' },
]

export const referralStages = ['Referred', 'Acknowledged', 'Investigation', 'Resolved'] as const

export const referrals = [
  { id: 'REF-118', issue: 'Recurring congestion, Thokkotu junction', segment: 'NH-66 Pumpwell–Thokkotu', agency: 'NHAI', stage: 2, sent: '21 Oct', reports: 26 },
  { id: 'REF-117', issue: 'Accident-prone U-turn, Pumpwell', segment: 'NH-66 Nanthoor–Pumpwell', agency: 'NHAI', stage: 1, sent: '18 Oct', reports: 19 },
  { id: 'REF-116', issue: 'Waterlogging on Ullal Road', segment: 'Ullal Road', agency: 'Mangaluru City Corporation', stage: 3, sent: '12 Oct', reports: 22 },
  { id: 'REF-115', issue: 'Signal outage, Nanthoor circle', segment: 'Nanthoor circle signal', agency: 'Traffic Police (signals)', stage: 0, sent: '23 Oct', reports: 5 },
]

// Road ownership: each segment mapped to its verified responsible agency
export const roadOwnership = [
  { segment: 'NH-66 Surathkal–Thokkotu', type: 'National Highway', agency: 'NHAI', verified: true, open: 2 },
  { segment: 'NH-73 Pumpwell–Padil', type: 'National Highway', agency: 'NHAI', verified: true, open: 0 },
  { segment: 'Hampankatta–Kankanady', type: 'City road', agency: 'Mangaluru City Corporation', verified: true, open: 0 },
  { segment: 'Ullal Road', type: 'City road', agency: 'Mangaluru City Corporation', verified: true, open: 1 },
  { segment: 'Nanthoor circle signal', type: 'Traffic signal', agency: 'Traffic Police (signals)', verified: true, open: 1 },
  { segment: 'Kulur bridge approach', type: 'State road', agency: 'PWD Karnataka', verified: false, open: 0 },
]

// Reports submitted by registered companies through the company portal
export type CompanyReport = {
  id: string; company: string; place: string; reason: Reason; employees: number; delayMin: number
  evidence: string[]; status: 'New' | 'Possible duplicate' | 'Verified' | 'Referred'; groupWith?: string; at: string
}
export const companyReports: CompanyReport[] = [
  { id: 'CR-9031', company: 'Infinite Tech Pvt Ltd', place: 'Thokkotu junction', reason: 'Road repair', employees: 6, delayMin: 24, evidence: ['GPS', 'Photo'], status: 'New', at: '09:02' },
  { id: 'CR-9030', company: 'Coastal Logistics', place: 'Thokkotu junction', reason: 'Road repair', employees: 3, delayMin: 21, evidence: ['GPS'], status: 'Possible duplicate', groupWith: 'CR-9031', at: '08:58' },
  { id: 'CR-9029', company: 'Karavali Hospital', place: 'Thokkotu junction', reason: 'Road repair', employees: 4, delayMin: 19, evidence: ['GPS', 'Video'], status: 'Possible duplicate', groupWith: 'CR-9031', at: '08:51' },
  { id: 'CR-9028', company: 'Infinite Tech Pvt Ltd', place: 'Pumpwell flyover', reason: 'Accident', employees: 3, delayMin: 32, evidence: ['GPS', 'Photo', 'Maps speed'], status: 'Verified', at: '08:40' },
  { id: 'CR-9027', company: 'Mangala Textiles', place: 'Ullal Road', reason: 'Flood', employees: 9, delayMin: 45, evidence: ['GPS', 'Photo'], status: 'Referred', at: '07:15' },
  { id: 'CR-9026', company: 'SDIT College', place: 'Nanthoor circle', reason: 'Signal failure', employees: 12, delayMin: 11, evidence: ['GPS'], status: 'New', at: '08:35' },
]

export const thokkotuEvidence = {
  place: 'Thokkotu junction',
  companies: 7,
  reports: 26,
  employeesAffected: 58,
  days: 15,
  avgDelay: 21,
  hoursLost: 860,
  mapsSpeed: '6 km/h avg at 8–9 am vs 34 km/h normal (Google Maps)',
  responsible: 'NHAI',
}

export const reporters = [
  { name: 'Ravi M', reports: 48, accuracy: 96 },
  { name: 'Sneha P', reports: 31, accuracy: 91 },
  { name: 'Imran A', reports: 22, accuracy: 84 },
  { name: 'Unknown #4412', reports: 9, accuracy: 41 },
]
