import { calculateOvertimeBC } from './overtime'
import { getWeekDates } from './dates'

/**
 * Generate ADP Workforce Now CSV export data from timesheet entries.
 *
 * @param {Object} timesheet - The timesheet object with rows and weekStart
 * @param {Object[]} employees - Employee records with adpFileNumber
 * @param {string} companyCode - ADP company code
 * @param {string} batchId - Batch identifier
 * @returns {Object[]} Array of row objects for CSV export
 */
export function generateADPExport(timesheet, employees, companyCode = 'CS1', batchId = '') {
  const weekDates = getWeekDates(timesheet.weekStart)
  const rows = []

  for (const row of timesheet.rows) {
    const employee = employees.find(e => e.id === row.employeeId)
    if (!employee) continue

    // Build daily entries from all hour types combined
    const dailyEntries = weekDates.map((date, i) => ({
      date,
      totalHours:
        (row.contractHrs?.[i] || 0) +
        (row.extraWorkHrs?.[i] || 0) +
        (row.standbyHrs?.[i] || 0) +
        (row.companyHrs?.[i] || 0),
    }))

    const { weekTotals } = calculateOvertimeBC(dailyEntries)

    // Regular hours
    if (weekTotals.regular > 0) {
      rows.push({
        'Company Code': companyCode,
        'Batch ID': batchId || `TS-${timesheet.weekStart}`,
        'File Number': employee.adpFileNumber || employee.id,
        'Employee Name': employee.name,
        'Earnings Code': 'REG',
        'Hours': weekTotals.regular.toFixed(2),
        'Pay Code': 'Regular',
        'Department': row.projectNo || '',
        'Cost Center': row.costCode || '',
        'Period Start': timesheet.weekStart,
        'Period End': weekDates[6],
      })
    }

    // OT 1.5x hours
    if (weekTotals.totalOT15 > 0) {
      rows.push({
        'Company Code': companyCode,
        'Batch ID': batchId || `TS-${timesheet.weekStart}`,
        'File Number': employee.adpFileNumber || employee.id,
        'Employee Name': employee.name,
        'Earnings Code': 'OT15',
        'Hours': weekTotals.totalOT15.toFixed(2),
        'Pay Code': 'Overtime 1.5x',
        'Department': row.projectNo || '',
        'Cost Center': row.costCode || '',
        'Period Start': timesheet.weekStart,
        'Period End': weekDates[6],
      })
    }

    // Double time hours
    if (weekTotals.ot20 > 0) {
      rows.push({
        'Company Code': companyCode,
        'Batch ID': batchId || `TS-${timesheet.weekStart}`,
        'File Number': employee.adpFileNumber || employee.id,
        'Employee Name': employee.name,
        'Earnings Code': 'DT',
        'Hours': weekTotals.ot20.toFixed(2),
        'Pay Code': 'Double Time',
        'Department': row.projectNo || '',
        'Cost Center': row.costCode || '',
        'Period Start': timesheet.weekStart,
        'Period End': weekDates[6],
      })
    }

    // Stat holiday line items
    if (weekTotals.statDays > 0) {
      rows.push({
        'Company Code': companyCode,
        'Batch ID': batchId || `TS-${timesheet.weekStart}`,
        'File Number': employee.adpFileNumber || employee.id,
        'Employee Name': employee.name,
        'Earnings Code': 'STAT',
        'Hours': (weekTotals.statDays * 8).toFixed(2),
        'Pay Code': 'Stat Holiday Premium',
        'Department': row.projectNo || '',
        'Cost Center': row.costCode || '',
        'Period Start': timesheet.weekStart,
        'Period End': weekDates[6],
      })
    }
  }

  return rows
}
