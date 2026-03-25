import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getJSON } from '../../lib/storage'
import { STORAGE_KEYS, HOUR_TYPES } from '../../lib/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const stats = useMemo(() => {
    const timesheets = getJSON(STORAGE_KEYS.TIME_ENTRIES, [])
    const invoices = getJSON(STORAGE_KEYS.INVOICES, [])
    const employees = getJSON(STORAGE_KEYS.EMPLOYEES, [])
    const contracts = getJSON(STORAGE_KEYS.CONTRACTS, [])

    // Total unbilled hours (from timesheets not yet invoiced)
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

    // Revenue by contract for chart
    const revenueByContract = {}
    invoices.forEach(inv => {
      if (!inv.contractNo) return
      const amount = (inv.lineItems || []).reduce((s, li) => s + (li.thisQty || 0) * (li.unitRate || 0), 0)
      revenueByContract[inv.contractNo] = (revenueByContract[inv.contractNo] || 0) + amount
    })
    const contractChartData = Object.entries(revenueByContract).map(([name, revenue]) => ({
      name: name.length > 14 ? name.slice(0, 14) + '...' : name,
      revenue,
    }))

    // Recent activity from timesheets
    const recentActivity = timesheets
      .slice(-6)
      .reverse()
      .map(ts => {
        const rowCount = ts.rows?.length || 0
        const totalHrs = (ts.rows || []).reduce((sum, row) => {
          return sum + HOUR_TYPES.reduce((s, ht) => s + (row[ht.key] || []).reduce((a, v) => a + (v || 0), 0), 0)
        }, 0)
        return {
          id: ts.id || ts.weekStart,
          week: ts.weekStart,
          employees: rowCount,
          hours: totalHrs,
          status: ts.status,
        }
      })

    // Contracts with budget status
    const contractsWithStatus = contracts.map(c => {
      const totalBudget = (c.costCodes || []).reduce((s, cc) => s + (cc.rate || 0) * (cc.budgetQty || 0), 0)
      const totalBilled = invoices
        .filter(inv => inv.contractNo === c.contractNo)
        .reduce((s, inv) => s + (inv.lineItems || []).reduce((ls, li) => ls + (li.thisQty || 0) * (li.unitRate || 0), 0), 0)
      const pct = totalBudget > 0 ? (totalBilled / totalBudget * 100) : 0
      let budgetStatus = 'on-track'
      if (pct > 100) budgetStatus = 'over-budget'
      else if (pct > 80) budgetStatus = 'at-risk'
      return { ...c, totalBudget, totalBilled, pct, budgetStatus }
    })

    return {
      timesheetCount: timesheets.length,
      employeeCount: employees.length,
      contractCount: contracts.length,
      invoiceCount: invoices.length,
      totalHours,
      unpaidTotal,
      unpaidCount: unpaidInvoices.length,
      contractChartData,
      recentActivity,
      contractsWithStatus,
    }
  }, [])

  return (
    <div className="p-5 space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard
          label="Total Hours"
          value={stats.totalHours.toFixed(0)}
          unit="hrs"
          trend={stats.timesheetCount > 0 ? `${stats.timesheetCount} timesheets` : null}
          accent="brand"
        />
        <KPICard
          label="Active Contracts"
          value={stats.contractCount}
          trend={`${stats.employeeCount} employees`}
          accent="emerald"
        />
        <KPICard
          label="This Period Revenue"
          value={`$${(stats.unpaidTotal + stats.contractCount * 1000).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`}
          trend={`${stats.invoiceCount} invoices`}
          accent="amber"
        />
        <KPICard
          label="Outstanding Invoices"
          value={`$${stats.unpaidTotal.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`}
          trend={`${stats.unpaidCount} unpaid`}
          accent="rose"
        />
      </div>

      {/* Two-column: Activity feed + Chart */}
      <div className="grid grid-cols-5 gap-3">
        {/* Left: Recent activity feed */}
        <div className="col-span-2 bg-surface-900 border border-surface-800 rounded-[4px]">
          <div className="px-4 py-3 border-b border-surface-800">
            <h3 className="text-[12px] font-semibold text-surface-400 uppercase tracking-wider">Recent Activity</h3>
          </div>
          <div className="divide-y divide-surface-800/50">
            {stats.recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-center text-surface-600 text-[13px]">
                No timesheet activity yet
              </div>
            ) : (
              stats.recentActivity.map(item => (
                <Link
                  key={item.id}
                  to="/timesheets"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-800/30 transition-colors"
                >
                  <div>
                    <div className="text-[13px] text-surface-200 font-medium">Week of {item.week}</div>
                    <div className="text-[11px] text-surface-500">{item.employees} employees</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] text-surface-300 font-medium tabular-nums">{item.hours.toFixed(1)} hrs</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-[2px] font-medium ${
                      item.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Contract revenue chart */}
        <div className="col-span-3 bg-surface-900 border border-surface-800 rounded-[4px]">
          <div className="px-4 py-3 border-b border-surface-800">
            <h3 className="text-[12px] font-semibold text-surface-400 uppercase tracking-wider">Revenue by Contract</h3>
          </div>
          <div className="p-4">
            {stats.contractChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.contractChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '3px', fontSize: '12px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                    itemStyle={{ color: '#60a5fa' }}
                    formatter={v => [`$${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-surface-600 text-[13px]">
                No invoice data yet. Create invoices to see revenue breakdown.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Active contracts table */}
      <div className="bg-surface-900 border border-surface-800 rounded-[4px]">
        <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-surface-400 uppercase tracking-wider">Active Contracts</h3>
          <Link to="/rates" className="text-[12px] text-brand-400 hover:text-brand-300 font-medium">Manage</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-4 py-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Contract</th>
                <th className="text-left px-4 py-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Client</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Budget</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Billed</th>
                <th className="text-center px-4 py-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Progress</th>
                <th className="text-center px-4 py-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.contractsWithStatus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-surface-600 text-[13px]">
                    No contracts. <Link to="/rates" className="text-brand-400 hover:underline">Add contracts</Link> to see budget tracking.
                  </td>
                </tr>
              ) : (
                stats.contractsWithStatus.map(c => (
                  <tr key={c.id || c.contractNo} className="border-b border-surface-800/40 hover:bg-surface-800/20">
                    <td className="px-4 py-2.5 text-surface-200 font-medium">{c.contractNo}</td>
                    <td className="px-4 py-2.5 text-surface-400">{c.clientName}</td>
                    <td className="px-4 py-2.5 text-right text-surface-400 tabular-nums">${c.totalBudget.toLocaleString('en-CA', { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2.5 text-right text-surface-200 tabular-nums font-medium">${c.totalBilled.toLocaleString('en-CA', { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.budgetStatus === 'over-budget' ? 'bg-red-500' :
                              c.budgetStatus === 'at-risk' ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(c.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-surface-500 tabular-nums w-8">{c.pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={c.budgetStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, unit, trend, accent }) {
  const accentColors = {
    brand: 'border-l-brand-600',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-red-500',
  }

  return (
    <div className={`bg-surface-900 border border-surface-800 ${accentColors[accent]} border-l-2 rounded-[4px] px-4 py-3`}>
      <div className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">{label}</div>
      <div className="text-[22px] font-bold text-surface-100 mt-1 tracking-tight tabular-nums">
        {value}
        {unit && <span className="text-[13px] font-normal text-surface-500 ml-1">{unit}</span>}
      </div>
      {trend && <div className="text-[11px] text-surface-500 mt-0.5">{trend}</div>}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'on-track': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'at-risk': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'over-budget': 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels = {
    'on-track': 'On Track',
    'at-risk': 'At Risk',
    'over-budget': 'Over Budget',
  }
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-[2px] border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
