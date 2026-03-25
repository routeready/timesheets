import { getBCStatHolidays } from './constants'

export function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekEnd(date) {
  const start = getWeekStart(date)
  start.setDate(start.getDate() + 6)
  return start
}

export function getWeekDates(weekStart) {
  const dates = []
  const d = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    dates.push(formatDateISO(new Date(d)))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

export function formatDateISO(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

export function isStatHoliday(dateStr) {
  const year = new Date(dateStr + 'T00:00:00').getFullYear()
  const holidays = getBCStatHolidays(year)
  return holidays.find(h => h.date === dateStr) || null
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
