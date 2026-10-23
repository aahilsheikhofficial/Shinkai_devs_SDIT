import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import EmployeeDashboard from './versions/employee/EmployeeDashboard'
import CompanyDashboard from './versions/company/CompanyDashboard'
import GovDashboard from './versions/gov/GovDashboard'
import CommuterView from './versions/commuter/CommuterView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/:domain" element={<Login />} />
      <Route path="/commuter" element={<CommuterView />} />
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/company" element={<CompanyDashboard />} />
      <Route path="/gov" element={<GovDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
