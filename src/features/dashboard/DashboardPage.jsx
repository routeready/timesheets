import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getJSON } from '../../lib/storage'
import { STORAGE_KEYS } from '../../lib/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const stats = useMemo(() => {
    const timesheets = getJSON(STORAGE_KEYS.TIME_ENTRIES, [])
    const invoices = getJSON(STORAGE_KEYS.INVOICES, [])
    const employees = getJSON(STORAGE_KEYS.EMPLOYEES, [])
    const contracts = getJSON(STORAGE_KEYS.CONTRACTS, [])

    const totalHours = timesheets.reduce((sum, ts) => {
      return sum + (ts.rows || []).reduce((rSum, row) => {
        const allHrs = [...(row.contractHrs || []), ...(row.extraWorkHrs || []), ...(row.standbyHrs || []), ...(row.companyHrs || [])]
        return rSum + allHrs.reduce((h, v) => h + (v || 0), 0)
      }, 0)
    }, 0)

    const unpaidInvoices = invoices.filter(i => i.status !== 'paid')
    const unpaidTotal = unpaidInvoices.reduce((sum, inv) => {
      const lineTotal = (inv.lineItems || []).reduce((s, li) => s + (li.thisQty || 0) * (li.unitRate || 0), 0)
      return sum + lineTotal * 1.05
    }, 0)

    // Weekly hours chart data from last 8 timesheets
    const chartData = timesheets.slice(-8).map(ts => {
      const weekHrs = (ts.rows || []).reduce((rSum, row) => {
        const allHrs = [...(row.contractHrs || []), ...(row.extraWorkHrs || []), ...(row.standbyHrs || []), ...(row.companyHrs || [])]
        return rSum + allHrs.reduce((h, v) => h + (v || 0), 0)
      }, 0)
      return { week: ts.weekStart?.slice(5) || '?', hours: weekHrs }
    })

    return {
      timesheetCount: timesheets.length,
      employeeCount: employees.length,
      contractCount: contracts.length,
      invoiceCount: invoices.length,
      totalHours,
      unpaidTotal,
      unpaidCount: unpaidInvoices.length,
      chartData,
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
        <p className="text-surface-400 text-sm mt-1">Overview of your contracting operations</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Timesheets"
          value={stats.timesheetCount}
          sub="submitted"
          color="brand"
          to="/timesheets"
        />
        <StatCard
          label="Employees"
          value={stats.employeeCount}
          sub="active"
          color="emerald"
          to="/rates"
        />
        <StatCard
          label="Total Hours"
          value={stats.totalHours.toFixed(1)}
          sub="all timesheets"
          color="amber"
          to="/timesheets"
        />
        <StatCard
          label="Outstanding"
          value={`$${stats.unpaidTotal.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub={`${stats.unpaidCount} unpaid invoices`}
          color="rose"
          to="/invoices"
        />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hours Chart */}
        <div className="lg:col-span-2 bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-surface-400 mb-4">Weekly Hours</h3>
          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-surface-500 text-sm">
              No timesheet data yet. Import or create a timesheet to see trends.
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-medium text-surface-400 mb-2">Quick Actions</h3>
          <QuickAction to="/timesheets" label="New Timesheet" desc="Create or import weekly timesheet" />
          <QuickAction to="/payroll" label="Export Payroll" desc="Generate ADP import file" />
          <QuickAction to="/invoices" label="New Invoice" desc="Create pro forma invoice" />
          <QuickAction to="/rates" label="Manage Rates" desc="Employee & equipment rates" />
          <QuickAction to="/settings" label="Company Settings" desc="Logo, GST number, terms" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, to }) {
  const colorMap = {
    brand: 'bg-brand-600/10 border-brand-600/20 text-brand-400',
    emerald: 'bg-emerald-600/10 border-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/10 border-amber-600/20 text-amber-400',
    rose: 'bg-rose-600/10 border-rose-600/20 text-rose-400',
  }

  return (
    <Link to={to} className={`rounded-xl border p-4 ${colorMap[color]} hover:opacity-80 transition-opacity`}>
      <div className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-60 mt-1">{sub}</div>
    </Link>
  )
}

function QuickAction({ to, label, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 border border-surface-700/30 transition-colors"
    >
      <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
      <div>
        <div className="text-sm font-medium text-surface-200">{label}</div>
        <div className="text-xs text-surface-500">{desc}</div>
      </div>
    </Link>
  )
}
