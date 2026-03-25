import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import DashboardPage from './features/dashboard/DashboardPage'
import TimesheetPage from './features/timesheets/TimesheetPage'
import RatesPage from './features/rates/RatesPage'
import PayrollPage from './features/payroll/PayrollPage'
import QuantitiesPage from './features/quantities/QuantitiesPage'
import InvoicesPage from './features/invoices/InvoicesPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/timesheets" element={<TimesheetPage />} />
          <Route path="/rates" element={<RatesPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/quantities" element={<QuantitiesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
