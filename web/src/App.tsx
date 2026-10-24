import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
import { hasMapsKey, MAPS_KEY } from './components/maps'
import Landing from './pages/Landing'
import { Toaster } from './components/toast'

// Each page loads as its own chunk, so the first screen stays light
const Login = lazy(() => import('./pages/Login'))
const CommuterView = lazy(() => import('./versions/commuter/CommuterView'))
const EmployeeDashboard = lazy(() => import('./versions/employee/EmployeeDashboard'))
const CompanyDashboard = lazy(() => import('./versions/company/CompanyDashboard'))
const GovDashboard = lazy(() => import('./versions/gov/GovDashboard'))

// Maps JS loads once here and is shared by every page (it starts while the user picks a role)
function Maps({ children }: { children: ReactNode }) {
  if (!hasMapsKey) return <>{children}</>
  return <APIProvider apiKey={MAPS_KEY} libraries={['marker', 'places']} region="IN" language="en">{children}</APIProvider>
}

export default function App() {
  return (
    <Maps>
      <Suspense fallback={<div className="min-h-screen grid place-items-center"><div className="size-8 rounded-full border-4 border-accent border-t-transparent animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login/:domain" element={<Login />} />
          <Route path="/commuter" element={<CommuterView />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/gov" element={<GovDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </Maps>
  )
}
