import { lazy, Suspense } from 'react'
import SvgTrafficMap, { type TrafficMapProps } from './SvgTrafficMap'
import { hasMapsKey } from './maps'

const GoogleTrafficMap = lazy(() => import('./GoogleTrafficMap'))

/** Real Google map when a key is set in .env, otherwise the drawn SVG map. */
export default function TrafficMap(props: TrafficMapProps) {
  if (!hasMapsKey) return <SvgTrafficMap {...props} />
  return (
    <Suspense fallback={<div className={`rounded-[1.1rem] bg-surface-2 animate-pulse ${props.className ?? ''}`} />}>
      <GoogleTrafficMap {...props} />
    </Suspense>
  )
}
