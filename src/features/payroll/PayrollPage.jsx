import { useState, useMemo } from 'react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, HOUR_TYPES } from '../../lib/constants'
import { getWeekDates, isStatHoliday } from '../../lib/dates'
import { calculateOvertimeBC, applyRates } from '../../lib/overtime'
import { generateADPExport } from '../../lib/adp'
import { exportToCSV } from '../../lib/excel'

export default function PayrollPage() {
  const toast = useToast()
  const [timesheets] = useLocalStorage(STORAGE_KEYS.TIME_ENTRIES, [])
  const [employees] = useLocalStorage(STORAGE_KEYS.EMPLOYEES, [])
  const [selectedTS, setSelectedTS] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const timesheet = timesheets.find(ts => ts.weekStart === selectedTS)

  // Check for stat holidays in selected week
  const statDays = useMemo(() => {
    if (!timesheet) return []
    const weekDates = getWeekDates(timesheet.weekStart)
    return weekDates.map(d => isStatHoliday(d)).filter(Boolean)
  }, [timesheet])

  const breakdown = useMemo(() => {
    if (!timesheet) return []

    const weekDates = getWeekDates(timesheet.weekStart)

    return timesheet.rows.map(row => {
      const emp = employees.find(e => e.id === row.employeeId)

      const dailyEntries = weekDates.map((date, i) => ({
        date,
        totalHours:
          (row.contractHrs?.[i] || 0) +
          (row.extraWorkHrs?.[i] || 0) +
          (row.standbyHrs?.[i] || 0) +
          (row.companyHrs?.[i] || 0),
      }))

      const { weekTotals, days } = calculateOvertimeBC(dailyEntries)

      const projectRate = emp?.projectRates?.find(r => r.projectNo === row.projectNo)
      const baseRate = projectRate?.rate || 0
      const pay = baseRate > 0 ? applyRates(weekTotals, baseRate) : null

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

  const csvPreview = useMemo(() => {
    if (!timesheet || breakdown.length === 0) return null
    const rows = generateADPExport(timesheet, employees)
    return rows
  }, [timesheet, breakdown, employees])

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
    { header: 'Employee', accessor: 'employeeName', cell: (v, row) => (
      <div>
        <span className="text-surface-200 font-medium">{v}</span>
        {statDays.length > 0 && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-[2px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">STAT</span>}
      </div>
    )},
    { header: 'Class.', accessor: 'classification', className: 'text-[12px]' },
    { header: 'Total', accessor: 'totalHours', cell: v => <span className="tabular-nums">{v.toFixed(1)}</span>, className: 'text-right' },
    { header: 'Regular', accessor: 'regular', cell: v => <span className="text-emerald-400 tabular-nums">{v.toFixed(1)}</span>, className: 'text-right' },
    { header: 'OT 1.5x', accessor: 'totalOT15', cell: v => v > 0 ? <span className="text-amber-400 tabular-nums">{v.toFixed(1)}</span> : <span className="text-surface-700">-</span>, className: 'text-right' },
    { header: 'DT 2.0x', accessor: 'ot20', cell: v => v > 0 ? <span className="text-red-400 tabular-nums">{v.toFixed(1)}</span> : <span className="text-surface-700">-</span>, className: 'text-right' },
    { header: 'Rate', accessor: 'baseRate', cell: v => v > 0 ? <span className="tabular-nums">${v.toFixed(2)}</span> : <span className="text-surface-700">--</span>, className: 'text-right' },
    { header: 'Gross Est.', accessor: 'totalPay', cell: v => v > 0 ? <span className="font-semibold text-surface-200 tabular-nums">${v.toFixed(2)}</span> : <span className="text-surface-700">-</span>, className: 'text-right' },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payroll Export" subtitle="Calculate overtime and generate ADP import file" />

      {/* Timesheet selector + stat info */}
      <div className="px-5 py-2.5 border-b border-surface-800 flex items-center gap-4 bg-surface-950">
        <label className="text-[12px] text-surface-500 font-medium">Period</label>
        <select
          value={selectedTS}
          onChange={e => setSelectedTS(e.target.value)}
          className="input-field w-56"
        >
          <option value="">Select a week</option>
          {timesheets.map(ts => (
            <option key={ts.weekStart} value={ts.weekStart}>
              {ts.weekStart} ({ts.rows?.length || 0} employees)
            </option>
          ))}
        </select>
        {timesheet && (
          <span className="text-[11px] text-surface-600">
            {timesheet.rows?.length || 0} employees &middot; BC overtime rules
          </span>
        )}
        {statDays.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-[2px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            {statDays.map(d => d.name).join(', ')}
          </span>
        )}
      </div>

      {/* Main content: split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: payroll table */}
        <div className="flex-1 overflow-auto">
          {!timesheet ? (
            <div className="flex items-center justify-center h-full text-surface-600 text-[13px]">
              Select a timesheet to preview payroll calculations
            </div>
          ) : (
            <DataTable columns={columns} data={breakdown} pageSize={50} compact />
          )}
        </div>

        {/* Right: export config panel */}
        {timesheet && breakdown.length > 0 && (
          <div className="w-72 border-l border-surface-800 bg-surface-900 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-surface-800">
              <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Export Config</h3>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-auto">
              {/* Summary stats */}
              <div className="space-y-2">
                <SummaryRow label="Employees" value={breakdown.length} />
                <SummaryRow label="Total Hours" value={grandTotals.totalHours.toFixed(1)} />
                <div className="border-t border-surface-800 pt-2 space-y-2">
                  <SummaryRow label="Regular" value={grandTotals.regular.toFixed(1)} color="text-emerald-400" />
                  <SummaryRow label="OT 1.5x" value={grandTotals.totalOT15.toFixed(1)} color="text-amber-400" />
                  <SummaryRow label="DT 2.0x" value={grandTotals.ot20.toFixed(1)} color="text-red-400" />
                </div>
                <div className="border-t border-surface-800 pt-2">
                  <SummaryRow label="Est. Payroll" value={`$${grandTotals.totalPay.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`} bold />
                </div>
              </div>

              {/* CSV Preview toggle */}
              {csvPreview && csvPreview.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
                  >
                    {showPreview ? 'Hide' : 'Show'} CSV Preview
                  </button>
                  {showPreview && (
                    <div className="mt-2 bg-surface-950 border border-surface-800 rounded-[3px] p-2 max-h-40 overflow-auto">
                      <pre className="text-[10px] text-surface-500 font-mono leading-relaxed">
                        {csvPreview.slice(0, 5).map((row, i) => (
                          <div key={i}>{Object.values(row).join(',')}</div>
                        ))}
                        {csvPreview.length > 5 && <div className="text-surface-700">...{csvPreview.length - 5} more rows</div>}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export button */}
            <div className="p-4 border-t border-surface-800">
              <button
                onClick={handleExport}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-[3px] font-semibold text-[13px] transition-all"
                style={{ boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)' }}
              >
                Generate ADP File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Totals bar */}
      {breakdown.length > 0 && (
        <div className="border-t border-surface-800 px-5 py-2.5 bg-surface-900 flex items-center gap-6 shrink-0">
          <div className="text-[11px] text-surface-500">
            <span className="font-semibold text-surface-300">{breakdown.length}</span> employees
          </div>
          <div className="text-[11px]">
            <span className="text-surface-500">Total:</span>{' '}
            <span className="font-semibold text-surface-300 tabular-nums">{grandTotals.totalHours.toFixed(1)} hrs</span>
          </div>
          <div className="text-[11px]">
            <span className="text-surface-500">Reg:</span>{' '}
            <span className="text-emerald-400 font-semibold tabular-nums">{grandTotals.regular.toFixed(1)}</span>
          </div>
          <div className="text-[11px]">
            <span className="text-surface-500">OT:</span>{' '}
            <span className="text-amber-400 font-semibold tabular-nums">{grandTotals.totalOT15.toFixed(1)}</span>
          </div>
          <div className="text-[11px]">
            <span className="text-surface-500">DT:</span>{' '}
            <span className="text-red-400 font-semibold tabular-nums">{grandTotals.ot20.toFixed(1)}</span>
          </div>
          <div className="ml-auto text-[13px] font-bold text-surface-100 tabular-nums">
            ${grandTotals.totalPay.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, color, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-surface-500">{label}</span>
      <span className={`text-[13px] tabular-nums ${bold ? 'font-bold text-surface-100' : color || 'font-medium text-surface-300'}`}>
        {value}
      </span>
    </div>
  )
}
