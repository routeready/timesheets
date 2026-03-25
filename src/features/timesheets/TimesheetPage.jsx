import { useState, useCallback } from 'react'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, HOUR_TYPES, DAYS_OF_WEEK, CLASSIFICATIONS } from '../../lib/constants'
import { getWeekStart, getWeekDates, formatDateISO, formatDateShort, isStatHoliday, generateId } from '../../lib/dates'
import { parseExcelFile } from '../../lib/excel'
import TimesheetMatrix from './TimesheetMatrix'
import ExcelImportMapper from './ExcelImportMapper'

export default function TimesheetPage() {
  const toast = useToast()
  const [timesheets, setTimesheets] = useLocalStorage(STORAGE_KEYS.TIME_ENTRIES, [])
  const [employees, setEmployees] = useLocalStorage(STORAGE_KEYS.EMPLOYEES, [])
  const [currentWeek, setCurrentWeek] = useState(() => formatDateISO(getWeekStart(new Date())))
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState(null)
  const [showAddRow, setShowAddRow] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const currentTS = timesheets.find(ts => ts.weekStart === currentWeek) || {
    id: generateId(),
    weekStart: currentWeek,
    rows: [],
    status: 'draft',
  }

  const weekDates = getWeekDates(currentWeek)

  const saveTimesheet = useCallback((updated) => {
    setTimesheets(prev => {
      const idx = prev.findIndex(ts => ts.weekStart === updated.weekStart)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = updated
        return copy
      }
      return [...prev, updated]
    })
  }, [setTimesheets])

  const handleCellChange = (rowIdx, hourType, dayIdx, value) => {
    const updated = { ...currentTS, rows: currentTS.rows.map((row, i) => {
      if (i !== rowIdx) return row
      return { ...row, [hourType]: row[hourType].map((v, j) => j === dayIdx ? value : v) }
    })}
    saveTimesheet(updated)
  }

  const handleAddRow = (data) => {
    let emp = employees.find(e => e.name === data.name)
    if (!emp) {
      emp = { id: generateId(), name: data.name, adpFileNumber: data.adpFileNumber || '', classification: data.classification }
      setEmployees(prev => [...prev, emp])
    }
    const newRow = {
      employeeId: emp.id,
      employeeName: emp.name,
      classification: data.classification,
      projectNo: data.projectNo || '',
      costCode: data.costCode || '',
      worksite: data.worksite || '',
      contractHrs: [0, 0, 0, 0, 0, 0, 0],
      extraWorkHrs: [0, 0, 0, 0, 0, 0, 0],
      standbyHrs: [0, 0, 0, 0, 0, 0, 0],
      companyHrs: [0, 0, 0, 0, 0, 0, 0],
    }
    const updated = { ...currentTS, rows: [...currentTS.rows, newRow] }
    saveTimesheet(updated)
    setShowAddRow(false)
    toast.success(`Added ${emp.name}`)
  }

  const handleDeleteRow = (rowIdx) => {
    const updated = { ...currentTS, rows: currentTS.rows.filter((_, i) => i !== rowIdx) }
    saveTimesheet(updated)
  }

  const handleWeekNav = (dir) => {
    const d = new Date(currentWeek + 'T00:00:00')
    d.setDate(d.getDate() + dir * 7)
    setCurrentWeek(formatDateISO(d))
  }

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseExcelFile(file)
      setImportData(parsed)
      setShowImport(true)
    } catch (err) {
      toast.error('Failed to parse Excel file: ' + err.message)
    }
    e.target.value = ''
  }

  const handleImportConfirm = (mappedRows) => {
    const newRows = mappedRows.map(row => {
      let emp = employees.find(e => e.name === row.name)
      if (!emp) {
        emp = { id: generateId(), name: row.name, adpFileNumber: row.adpFileNumber || '', classification: row.classification || 'Labourer' }
        setEmployees(prev => [...prev, emp])
      }
      return {
        employeeId: emp.id,
        employeeName: row.name,
        classification: row.classification || emp.classification || '',
        projectNo: row.projectNo || '',
        costCode: row.costCode || '',
        worksite: row.worksite || '',
        contractHrs: row.contractHrs || [0, 0, 0, 0, 0, 0, 0],
        extraWorkHrs: row.extraWorkHrs || [0, 0, 0, 0, 0, 0, 0],
        standbyHrs: row.standbyHrs || [0, 0, 0, 0, 0, 0, 0],
        companyHrs: row.companyHrs || [0, 0, 0, 0, 0, 0, 0],
      }
    })
    const updated = { ...currentTS, rows: [...currentTS.rows, ...newRows] }
    saveTimesheet(updated)
    setShowImport(false)
    setImportData(null)
    toast.success(`Imported ${newRows.length} rows`)
  }

  const handleLoadTimesheet = (ts) => {
    setCurrentWeek(ts.weekStart)
    setShowHistory(false)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Timesheets" subtitle={`Week of ${formatDateShort(weekDates[0])} — ${formatDateShort(weekDates[6])}`}>
        <button onClick={() => setShowHistory(true)} className="btn-secondary text-[12px]">
          History
        </button>
        <label className="btn-secondary text-[12px] cursor-pointer">
          Import Excel
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
        </label>
        <button onClick={() => setShowAddRow(true)} className="btn-primary text-[12px]">
          + Add Row
        </button>
      </PageHeader>

      {/* Week navigation */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-surface-800 bg-surface-950">
        <button onClick={() => handleWeekNav(-1)} className="text-surface-500 hover:text-surface-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex gap-0.5">
          {weekDates.map((date, i) => {
            const stat = isStatHoliday(date)
            return (
              <div key={date} className={`text-center px-2.5 py-1 rounded-[2px] text-[11px] ${stat ? 'bg-red-950/50 text-red-400 border border-red-900/30' : 'text-surface-500'}`}>
                <div className="font-semibold">{DAYS_OF_WEEK[i]}</div>
                <div className="tabular-nums">{formatDateShort(date)}</div>
                {stat && <div className="text-[9px] text-red-500/80 mt-0.5 font-medium">{stat.name}</div>}
              </div>
            )
          })}
        </div>
        <button onClick={() => handleWeekNav(1)} className="text-surface-500 hover:text-surface-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <div className="ml-auto flex items-center gap-2.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-[2px] font-semibold uppercase tracking-wider ${currentTS.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {currentTS.status}
          </span>
          <input
            type="date"
            value={currentWeek}
            onChange={(e) => setCurrentWeek(formatDateISO(getWeekStart(new Date(e.target.value))))}
            className="bg-surface-900 border border-surface-800 rounded-[3px] px-2 py-1 text-[11px] text-surface-400"
          />
        </div>
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto">
        <TimesheetMatrix
          rows={currentTS.rows}
          weekDates={weekDates}
          onCellChange={handleCellChange}
          onDeleteRow={handleDeleteRow}
        />
      </div>

      {/* Summary bar */}
      <TimesheetSummaryBar rows={currentTS.rows} />

      {/* Add Row Modal */}
      <Modal open={showAddRow} onClose={() => setShowAddRow(false)} title="Add Employee Row">
        <AddRowForm onSubmit={handleAddRow} onCancel={() => setShowAddRow(false)} />
      </Modal>

      {/* Excel Import Modal */}
      <Modal open={showImport} onClose={() => { setShowImport(false); setImportData(null) }} title="Map Excel Columns" wide>
        {importData && (
          <ExcelImportMapper
            data={importData}
            onConfirm={handleImportConfirm}
            onCancel={() => { setShowImport(false); setImportData(null) }}
          />
        )}
      </Modal>

      {/* History Modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Timesheet History">
        <div className="space-y-1.5">
          {timesheets.length === 0 ? (
            <p className="text-surface-600 text-[13px]">No saved timesheets</p>
          ) : (
            timesheets.map(ts => (
              <button
                key={ts.id || ts.weekStart}
                onClick={() => handleLoadTimesheet(ts)}
                className={`w-full text-left p-3 rounded-[3px] border transition-colors ${
                  ts.weekStart === currentWeek
                    ? 'border-brand-600/50 bg-brand-600/5'
                    : 'border-surface-800 bg-surface-900/50 hover:bg-surface-800/50'
                }`}
              >
                <div className="text-[13px] font-medium text-surface-200">Week of {ts.weekStart}</div>
                <div className="text-[11px] text-surface-500 mt-0.5">{ts.rows?.length || 0} employees &middot; {ts.status}</div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

function TimesheetSummaryBar({ rows }) {
  const totals = rows.reduce(
    (acc, row) => {
      HOUR_TYPES.forEach(ht => {
        acc[ht.key] += (row[ht.key] || []).reduce((s, v) => s + (v || 0), 0)
      })
      return acc
    },
    { contractHrs: 0, extraWorkHrs: 0, standbyHrs: 0, companyHrs: 0 }
  )
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

  const items = [
    { key: 'contractHrs', label: 'Contract', color: 'bg-brand-600' },
    { key: 'extraWorkHrs', label: 'Extra Work', color: 'bg-amber-500' },
    { key: 'standbyHrs', label: 'Standby', color: 'bg-violet-500' },
    { key: 'companyHrs', label: 'Company', color: 'bg-emerald-500' },
  ]

  return (
    <div className="border-t border-surface-800 px-5 py-2.5 flex items-center gap-5 bg-surface-900 shrink-0">
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-[1px] ${item.color}`} />
          <span className="text-[11px] text-surface-500">{item.label}</span>
          <span className="text-[13px] font-semibold text-surface-300 tabular-nums">{totals[item.key].toFixed(1)}</span>
        </div>
      ))}
      <div className="ml-auto text-[13px] font-bold text-surface-100 tabular-nums">
        {grandTotal.toFixed(1)} hrs
      </div>
    </div>
  )
}

function AddRowForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '', adpFileNumber: '', classification: 'Journeyman', projectNo: '', costCode: '', worksite: '',
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Employee Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="John Smith" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">ADP File Number</label>
          <input value={form.adpFileNumber} onChange={e => setForm(f => ({ ...f, adpFileNumber: e.target.value }))} className="input-field" placeholder="EMP001" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Classification</label>
          <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} className="input-field">
            {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Project Number</label>
          <input value={form.projectNo} onChange={e => setForm(f => ({ ...f, projectNo: e.target.value }))} className="input-field" placeholder="P-2026-001" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Cost Code</label>
          <input value={form.costCode} onChange={e => setForm(f => ({ ...f, costCode: e.target.value }))} className="input-field" placeholder="03-100" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Worksite</label>
          <input value={form.worksite} onChange={e => setForm(f => ({ ...f, worksite: e.target.value }))} className="input-field" placeholder="Site A" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={() => form.name && onSubmit(form)}
          disabled={!form.name}
          className="btn-primary disabled:opacity-40"
        >
          Add Employee
        </button>
      </div>
    </div>
  )
}
