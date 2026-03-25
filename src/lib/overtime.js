import { getBCStatHolidays } from './constants'

/**
 * Calculate BC Employment Standards Act overtime for a single employee over a week.
 *
 * Daily rules:
 *   - First 8 hours: regular
 *   - 8-12 hours: overtime at 1.5x
 *   - Over 12 hours: double time at 2x
 *
 * Weekly rules (applied AFTER daily breakdown):
 *   - Total regular hours over 40 in the week bump to 1.5x
 *
 * @param {Object[]} dailyEntries - Array of { date: 'YYYY-MM-DD', totalHours: number }
 *   Must be 7 entries for Sun-Sat of the same week.
 * @returns {{ days: DayBreakdown[], weekTotals: WeekTotals }}
 */
export function calculateOvertimeBC(dailyEntries) {
  const year = dailyEntries[0]?.date ? new Date(dailyEntries[0].date).getFullYear() : new Date().getFullYear()
  const statHolidays = getBCStatHolidays(year).map(h => h.date)

  // Step 1: Daily breakdown
  const days = dailyEntries.map(entry => {
    const hrs = Math.max(0, entry.totalHours || 0)
    const isStatHoliday = statHolidays.includes(entry.date)

    const regular = Math.min(hrs, 8)
    const ot15 = Math.min(Math.max(hrs - 8, 0), 4) // hours 8-12
    const ot20 = Math.max(hrs - 12, 0) // hours over 12

    return {
      date: entry.date,
      totalHours: hrs,
      regular,
      ot15,
      ot20,
      isStatHoliday,
    }
  })

  // Step 2: Weekly overtime - regular hours over 40 bump to 1.5x
  let totalRegular = days.reduce((sum, d) => sum + d.regular, 0)
  let weeklyOTBump = 0

  if (totalRegular > 40) {
    weeklyOTBump = totalRegular - 40
    // Reduce regular hours from the last days worked first (going backwards through the week)
    let remaining = weeklyOTBump
    for (let i = days.length - 1; i >= 0 && remaining > 0; i--) {
      const take = Math.min(days[i].regular, remaining)
      days[i].regular -= take
      days[i].weeklyOT = (days[i].weeklyOT || 0) + take
      remaining -= take
    }
  }

  // Ensure weeklyOT is initialized on all days
  days.forEach(d => { d.weeklyOT = d.weeklyOT || 0 })

  const weekTotals = {
    regular: days.reduce((s, d) => s + d.regular, 0),
    ot15: days.reduce((s, d) => s + d.ot15, 0),
    ot20: days.reduce((s, d) => s + d.ot20, 0),
    weeklyOT: days.reduce((s, d) => s + d.weeklyOT, 0),
    totalHours: days.reduce((s, d) => s + d.totalHours, 0),
    statDays: days.filter(d => d.isStatHoliday && d.totalHours > 0).length,
  }

  // Combine daily OT and weekly OT into a single OT1.5 total
  weekTotals.totalOT15 = weekTotals.ot15 + weekTotals.weeklyOT

  return { days, weekTotals }
}

/**
 * Calculate stat holiday pay: average daily wage over last 30 calendar days
 * @param {number} totalWages30Days - Total wages earned in the 30 days before the stat
 * @param {number} daysWorked30Days - Number of days actually worked in those 30 days
 * @returns {number} Stat holiday pay amount
 */
export function calculateStatPay(totalWages30Days, daysWorked30Days) {
  if (daysWorked30Days <= 0) return 0
  return totalWages30Days / daysWorked30Days
}

/**
 * Apply rates to an overtime breakdown
 */
export function applyRates(weekTotals, baseRate) {
  return {
    regularPay: weekTotals.regular * baseRate,
    ot15Pay: weekTotals.totalOT15 * baseRate * 1.5,
    ot20Pay: weekTotals.ot20 * baseRate * 2.0,
    totalPay:
      weekTotals.regular * baseRate +
      weekTotals.totalOT15 * baseRate * 1.5 +
      weekTotals.ot20 * baseRate * 2.0,
  }
}
