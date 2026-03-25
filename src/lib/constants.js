export const STORAGE_KEYS = {
  EMPLOYEES: 'cs_employees',
  TIME_ENTRIES: 'cs_time_entries',
  CONTRACTS: 'cs_contracts',
  INVOICES: 'cs_invoices',
  RATE_TABLES: 'cs_rate_tables',
  COMPANY_SETTINGS: 'cs_company_settings',
  ADP_CONFIG: 'cs_adp_config',
}

export const CLASSIFICATIONS = [
  'Journeyman',
  'Foreman',
  'General Foreman',
  'Superintendent',
  'Labourer',
  'Apprentice 1st Year',
  'Apprentice 2nd Year',
  'Apprentice 3rd Year',
  'Apprentice 4th Year',
  'Operator',
  'Teamster',
  'Welder',
  'Pipefitter',
  'Electrician',
  'Ironworker',
  'Carpenter',
  'Millwright',
]

export const HOUR_TYPES = [
  { key: 'contractHrs', label: 'Contract Labour', color: 'contract' },
  { key: 'extraWorkHrs', label: 'Extra Work', color: 'extra-work' },
  { key: 'standbyHrs', label: 'Standby', color: 'standby' },
  { key: 'companyHrs', label: 'Company', color: 'company' },
]

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// BC Statutory Holidays (fixed dates + computed dates)
export function getBCStatHolidays(year) {
  const holidays = [
    { name: "New Year's Day", date: `${year}-01-01` },
    { name: 'Family Day', date: getNthDayOfMonth(year, 1, 1, 3) }, // 3rd Monday of Feb
    { name: 'Good Friday', date: getGoodFriday(year) },
    { name: 'Victoria Day', date: getVictoriaDay(year) },
    { name: 'Canada Day', date: `${year}-07-01` },
    { name: 'BC Day', date: getNthDayOfMonth(year, 7, 1, 1) }, // 1st Monday of Aug
    { name: 'Labour Day', date: getNthDayOfMonth(year, 8, 1, 1) }, // 1st Monday of Sep
    { name: 'National Day for Truth and Reconciliation', date: `${year}-09-30` },
    { name: 'Thanksgiving', date: getNthDayOfMonth(year, 9, 1, 2) }, // 2nd Monday of Oct
    { name: 'Remembrance Day', date: `${year}-11-11` },
    { name: 'Christmas Day', date: `${year}-12-25` },
  ]
  return holidays
}

function getNthDayOfMonth(year, month, dayOfWeek, n) {
  const firstDay = new Date(year, month, 1)
  let diff = dayOfWeek - firstDay.getDay()
  if (diff < 0) diff += 7
  const day = 1 + diff + (n - 1) * 7
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getGoodFriday(year) {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  // Easter Sunday, Good Friday is 2 days before
  const easter = new Date(year, month - 1, day)
  easter.setDate(easter.getDate() - 2)
  return `${year}-${String(easter.getMonth() + 1).padStart(2, '0')}-${String(easter.getDate()).padStart(2, '0')}`
}

function getVictoriaDay(year) {
  // Last Monday before May 25
  const may25 = new Date(year, 4, 25)
  const dayOfWeek = may25.getDay()
  const diff = dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const day = 25 - diff
  return `${year}-05-${String(day).padStart(2, '0')}`
}

export const UNITS = ['hours', 'each', 'lump sum', 'tonnes', 'm3', 'm2', 'lineal m', 'kg', 'days']

export const DEFAULT_COMPANY_SETTINGS = {
  companyName: '',
  address: '',
  city: '',
  province: 'BC',
  postalCode: '',
  phone: '',
  email: '',
  gstNumber: '',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1001,
  paymentTerms: 'Net 30',
  logo: null,
}
