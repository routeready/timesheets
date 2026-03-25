import { useState } from 'react'

const MAPPABLE_FIELDS = [
  { key: 'name', label: 'Employee Name', required: true },
  { key: 'adpFileNumber', label: 'Employee Number', required: false },
  { key: 'classification', label: 'Classification', required: false },
  { key: 'projectNo', label: 'Project Number', required: false },
  { key: 'costCode', label: 'Cost Code', required: false },
  { key: 'worksite', label: 'Worksite', required: false },
  { key: 'sunHrs', label: 'Sunday Hours', required: false },
  { key: 'monHrs', label: 'Monday Hours', required: false },
  { key: 'tueHrs', label: 'Tuesday Hours', required: false },
  { key: 'wedHrs', label: 'Wednesday Hours', required: false },
  { key: 'thuHrs', label: 'Thursday Hours', required: false },
  { key: 'friHrs', label: 'Friday Hours', required: false },
  { key: 'satHrs', label: 'Saturday Hours', required: false },
]

export default function ExcelImportMapper({ data, onConfirm, onCancel }) {
  const { headers, rows } = data

  const [mapping, setMapping] = useState(() => {
    const m = {}
    MAPPABLE_FIELDS.forEach(field => {
      const idx = headers.findIndex(h => {
        const hl = String(h).toLowerCase()
        const patterns = getAutoDetectPatterns(field.key)
        return patterns.some(p => hl.includes(p))
      })
      if (idx >= 0) m[field.key] = idx
    })
    return m
  })

  const setFieldMapping = (fieldKey, colIdx) => {
    setMapping(prev => {
      if (colIdx === '') {
        const next = { ...prev }
        delete next[fieldKey]
        return next
      }
      return { ...prev, [fieldKey]: parseInt(colIdx) }
    })
  }

  const handleConfirm = () => {
    const nameCol = mapping.name
    if (nameCol == null) return

    const dayKeys = ['sunHrs', 'monHrs', 'tueHrs', 'wedHrs', 'thuHrs', 'friHrs', 'satHrs']

    const mappedRows = rows
      .filter(row => row[nameCol])
      .map(row => {
        const hours = dayKeys.map(dk => {
          const col = mapping[dk]
          return col != null ? parseFloat(row[col]) || 0 : 0
        })

        return {
          name: String(row[nameCol] || '').trim(),
          adpFileNumber: mapping.adpFileNumber != null ? String(row[mapping.adpFileNumber] || '') : '',
          classification: mapping.classification != null ? String(row[mapping.classification] || '') : '',
          projectNo: mapping.projectNo != null ? String(row[mapping.projectNo] || '') : '',
          costCode: mapping.costCode != null ? String(row[mapping.costCode] || '') : '',
          worksite: mapping.worksite != null ? String(row[mapping.worksite] || '') : '',
          contractHrs: hours,
          extraWorkHrs: [0, 0, 0, 0, 0, 0, 0],
          standbyHrs: [0, 0, 0, 0, 0, 0, 0],
          companyHrs: [0, 0, 0, 0, 0, 0, 0],
        }
      })

    onConfirm(mappedRows)
  }

  const previewRows = rows.slice(0, 5)

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-surface-500">
        Map your Excel columns to timesheet fields. <span className="text-surface-300 font-medium">{rows.length}</span> data rows found.
      </p>

      {/* Column mapping */}
      <div className="grid grid-cols-2 gap-2.5">
        {MAPPABLE_FIELDS.map(field => (
          <div key={field.key} className="flex items-center gap-2">
            <label className="text-[11px] text-surface-500 w-28 shrink-0 font-medium">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <select
              value={mapping[field.key] ?? ''}
              onChange={(e) => setFieldMapping(field.key, e.target.value)}
              className="input-field text-[12px] flex-1"
            >
              <option value="">-- Skip --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>Col {i + 1}: {h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div>
        <h4 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2">Preview (first 5 rows)</h4>
        <div className="overflow-x-auto rounded-[3px] border border-surface-800">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-surface-850">
                {headers.map((h, i) => (
                  <th key={i} className="px-2 py-1.5 text-left text-surface-500 font-medium whitespace-nowrap text-[11px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="border-t border-surface-800/50">
                  {headers.map((_, j) => (
                    <td key={j} className="px-2 py-1 text-surface-400 whitespace-nowrap">
                      {row[j] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={handleConfirm}
          disabled={mapping.name == null}
          className="btn-primary disabled:opacity-40"
        >
          Import {rows.filter(r => r[mapping.name]).length} Rows
        </button>
      </div>
    </div>
  )
}

function getAutoDetectPatterns(key) {
  const map = {
    name: ['name', 'employee', 'worker'],
    adpFileNumber: ['file number', 'employee id', 'emp id', 'emp #', 'emp no'],
    classification: ['class', 'trade', 'position', 'role'],
    projectNo: ['project', 'proj', 'job'],
    costCode: ['cost code', 'cost', 'code'],
    worksite: ['site', 'worksite', 'location'],
    sunHrs: ['sun', 'sunday'],
    monHrs: ['mon', 'monday'],
    tueHrs: ['tue', 'tuesday'],
    wedHrs: ['wed', 'wednesday'],
    thuHrs: ['thu', 'thursday'],
    friHrs: ['fri', 'friday'],
    satHrs: ['sat', 'saturday'],
  }
  return map[key] || []
}
