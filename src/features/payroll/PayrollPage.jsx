import { useState, useMemo } from 'react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, HOUR_TYPES } from '../../lib/constants'
import { getWeekDates } from '../../lib/dates'
import { calculateOvertimeBC, applyRates } from '../../lib/overtime'
import { generateADPExport } from '../../lib/adp'
import { exportToCSV } from '../../lib/excel'

export default function PayrollPage() {
  const toast = useToast()
  const [timesheets] = useLocalStorage(STORAGE_KEYS.TIME_ENTRIES, [])
  const [employees] = useLocalStorage(STORAGE_KEYS.EMPLOYEES, [])
  const [selectedTS, setSelectedTS] = useState('')

  const timesheet = timesheets.find(ts => ts.weekStart === selectedTS)

  const breakdown = useMemo(() => {
    if (!timesheet) return []

    const weekDates = getWeekDates(timesheet.weekStart)

    return timesheet.rows.map(row => {
      const emp = employees.find(e => e.id === row.employeeId)

      // Combine all hour types per day
      const dailyEntries = weekDates.map((date, i) => ({
        date,
        totalHours:
          (row.contractHrs?.[i] || 0) +
          (row.extraWorkHrs?.[i] || 0) +
          (row.standbyHrs?.[i] || 0) +
          (row.companyHrs?.[i] || 0),
      }))

      const { weekTotals, days } = calculateOvertimeBC(dailyEntries)

      // Find rate for this project
      const projectRate = emp?.projectRates?.find(r => r.projectNo === row.projectNo)
      const baseRate = projectRate?.rate || 0
      const pay = baseRate > 0 ? applyRates(weekTotals, baseRate) : null

      // Hour type breakdown
      const contractTotal = (row.contractHrs || []).reduce((s, v) => s + (v || 0), 0)
      const extraTotal = (row.extraWorkHrs || []).reduce((s, v) => s + (v || 0), 0)
      const standbyTotal = (row.standbyHrs || []).reduce((s, v) => s + (v || 0), 0)
      const companyTotal = (row.companyHrs || []).reduce((s, v) => s + (v || 0), 0)

      return {
        employeeName: row.employeeName || emp?.name || 'Unknown',
        classification: row.classification || emp?.classification || '',
        projectNo: row.projectNo,
        costCode: row.costCode,
        contractTotal,
        extraTotal,
        standbyTotal,
        companyTotal,
        ...weekTotals,
        baseRate,
        regularPay: pay?.regularPay || 0,
        ot15Pay: pay?.ot15Pay || 0,
        ot20Pay: pay?.ot20Pay || 0,
        totalPay: pay?.totalPay || 0,
        days,
      }
    })
  }, [timesheet, employees])

  const grandTotals = useMemo(() => {
    return breakdown.reduce((acc, row) => ({
      totalHours: acc.totalHours + row.totalHours,
      regular: acc.regular + row.regular,
      totalOT15: acc.totalOT15 + row.totalOT15,
      ot20: acc.ot20 + row.ot20,
      regularPay: acc.regularPay + row.regularPay,
      ot15Pay: acc.ot15Pay + row.ot15Pay,
      ot20Pay: acc.ot20Pay + row.ot20Pay,
      totalPay: acc.totalPay + row.totalPay,
    }), { totalHours: 0, regular: 0, totalOT15: 0, ot20: 0, regularPay: 0, ot15Pay: 0, ot20Pay: 0, totalPay: 0 })
  }, [breakdown])

  const handleExport = () => {
    if (!timesheet) return
    const rows = generateADPExport(timesheet, employees)
    if (rows.length === 0) {
      toast.error('No data to export')
      return
    }
    exportToCSV(rows, `ADP_Import_${timesheet.weekStart}.csv`)
    toast.success(`Exported ${rows.length} line items to CSV`)
  }

  const columns = [
    { header: 'Employee', accessor: 'employeeName' },
    { header: 'Class.', accessor: 'classification', className: 'text-xs' },
    { header: 'Project', accessor: 'projectNo', className: 'text-xs' },
    { header: 'Total Hrs', accessor: 'totalHours', cell: v => v.toFixed(1), className: 'text-right' },
    { header: 'Regular', accessor: 'regular', cell: v => <span className="text-emerald-400">{v.toFixed(1)}</span>, className: 'text-right' },
    { header: 'OT 1.5x', accessor: 'totalOT15', cell: v => v > 0 ? <span className="text-amber-400">{v.toFixed(1)}</span> : '-', className: 'text-right' },
    { header: 'DT 2.0x', accessor: 'ot20', cell: v => v > 0 ? <span className="text-red-400">{v.toFixed(1)}</span> : '-', className: 'text-right' },
    { header: 'Rate', accessor: 'baseRate', cell: v => v > 0 ? `$${v.toFixed(2)}` : <span className="text-surface-600">--</span>, className: 'text-right' },
    { header: 'Reg Pay', accessor: 'regularPay', cell: v => v > 0 ? `$${v.toFixed(2)}` : '-', className: 'text-right' },
    { header: 'OT Pay', accessor: 'ot15Pay', cell: v => v > 0 ? `$${v.toFixed(2)}` : '-', className: 'text-right' },
    { header: 'DT Pay', accessor: 'ot20Pay', cell: v => v > 0 ? `$${v.toFixed(2)}` : '-', className: 'text-right' },
    { header: 'Total Pay', accessor: 'totalPay', cell: v => v > 0 ? <span className="font-semibold">${v.toFixed(2)}</span> : '-', className: 'text-right' },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payroll Export" subtitle="Calculate overtime and export ADP import file">
        <button onClick={handleExport} disabled={!timesheet || breakdown.length === 0} className="btn-primary text-xs disabled:opacity-40">
          Export ADP CSV
        </button>
      </PageHeader>

      {/* Timesheet selector */}
      <div className="px-6 py-3 border-b border-surface-800 flex items-center gap-4">
        <label className="text-sm text-surface-400">Select Timesheet:</label>
        <select
          value={selectedTS}
          onChange={e => setSelectedTS(e.target.value)}
          className="input-field text-sm w-64"
        >
          <option value="">-- Select a week --</option>
          {timesheets.map(ts => (
            <option key={ts.weekStart} value={ts.weekStart}>
              Week of {ts.weekStart} ({ts.rows?.length || 0} employees)
            </option>
          ))}
        </select>
        {timesheet && (
          <span className="text-xs text-surface-500">
            {timesheet.rows?.length || 0} employees &middot; BC overtime rules applied
          </span>
        )}
      </div>

      {/* Breakdown table */}
      <div className="flex-1 overflow-auto">
        {!timesheet ? (
          <div className="flex items-center justify-center h-full text-surface-500 text-sm">
            Select a timesheet to preview payroll calculations
          </div>
        ) : (
          <DataTable columns={columns} data={breakdown} pageSize={50} compact />
        )}
      </div>

      {/* Totals bar */}
      {breakdown.length > 0 && (
        <div className="border-t border-surface-800 px-6 py-3 bg-surface-900/80 flex items-center gap-8">
          <div className="text-xs text-surface-400">
            <span className="font-medium text-surface-300">{breakdown.length}</span> employees
          </div>
          <div className="text-xs">
            <span className="text-surface-400">Total:</span>{' '}
            <span className="font-semibold text-surface-200">{grandTotals.totalHours.toFixed(1)} hrs</span>
          </div>
          <div className="text-xs">
            <span className="text-surface-400">Regular:</span>{' '}
            <span className="text-emerald-400 font-semibold">{grandTotals.regular.toFixed(1)}</span>
          </div>
          <div className="text-xs">
            <span className="text-surface-400">OT 1.5x:</span>{' '}
            <span className="text-amber-400 font-semibold">{grandTotals.totalOT15.toFixed(1)}</span>
          </div>
          <div className="text-xs">
            <span className="text-surface-400">DT 2.0x:</span>{' '}
            <span className="text-red-400 font-semibold">{grandTotals.ot20.toFixed(1)}</span>
          </div>
          <div className="ml-auto text-sm font-bold text-surface-100">
            Total Pay: ${grandTotals.totalPay.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  )
}
