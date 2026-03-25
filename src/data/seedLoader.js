import { setJSON } from '../lib/storage'
import { STORAGE_KEYS } from '../lib/constants'
import {
  SAMPLE_EMPLOYEES,
  SAMPLE_CONTRACTS,
  SAMPLE_TIMESHEETS,
  SAMPLE_COMPANY_SETTINGS,
} from './sampleData'

/**
 * Writes all sample data to localStorage.
 * Returns the count of records loaded.
 */
export function loadSampleData() {
  setJSON(STORAGE_KEYS.EMPLOYEES, SAMPLE_EMPLOYEES)
  setJSON(STORAGE_KEYS.CONTRACTS, SAMPLE_CONTRACTS)
  setJSON(STORAGE_KEYS.TIME_ENTRIES, SAMPLE_TIMESHEETS)
  setJSON(STORAGE_KEYS.COMPANY_SETTINGS, SAMPLE_COMPANY_SETTINGS)

  return {
    employees: SAMPLE_EMPLOYEES.length,
    contracts: SAMPLE_CONTRACTS.length,
    timesheets: SAMPLE_TIMESHEETS.length,
    timesheetRows: SAMPLE_TIMESHEETS.reduce((sum, ts) => sum + ts.rows.length, 0),
  }
}
