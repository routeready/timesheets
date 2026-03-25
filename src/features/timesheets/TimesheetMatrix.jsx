import { HOUR_TYPES, DAYS_OF_WEEK } from '../../lib/constants'

const TYPE_COLORS = {
  contractHrs: 'border-l-contract',
  extraWorkHrs: 'border-l-extra-work',
  standbyHrs: 'border-l-standby',
  companyHrs: 'border-l-company',
}

const TYPE_BG = {
  contractHrs: 'bg-blue-500/5',
  extraWorkHrs: 'bg-amber-500/5',
  standbyHrs: 'bg-violet-500/5',
  companyHrs: 'bg-emerald-500/5',
}

export default function TimesheetMatrix({ rows, weekDates, onCellChange, onDeleteRow }) {
  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <svg className="w-16 h-16 text-surface-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-surface-500 text-sm">No employees added yet</p>
          <p className="text-surface-600 text-xs mt-1">Click "+ Add Row" or import an Excel file to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-surface-500 uppercase tracking-wider">
            <th className="text-left px-3 py-2 w-48 sticky left-0 bg-surface-950 z-10">Employee</th>
            <th className="text-left px-2 py-2 w-20">Project</th>
            <th className="text-left px-2 py-2 w-20">Cost Code</th>
            <th className="text-left px-2 py-2 w-24">Type</th>
            {DAYS_OF_WEEK.map((day, i) => (
              <th key={day} className="text-center px-1 py-2 w-16">{day}</th>
            ))}
            <th className="text-center px-2 py-2 w-16 font-bold">Total</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <EmployeeBlock
              key={rowIdx}
              row={row}
              rowIdx={rowIdx}
              onCellChange={onCellChange}
              onDelete={() => onDeleteRow(rowIdx)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmployeeBlock({ row, rowIdx, onCellChange, onDelete }) {
  return (
    <>
      {HOUR_TYPES.map((ht, htIdx) => (
        <tr
          key={ht.key}
          className={`${TYPE_BG[ht.key]} border-l-2 ${TYPE_COLORS[ht.key]} ${htIdx === 0 ? 'border-t border-surface-700/30' : ''}`}
        >
          {/* Employee info only in first row */}
          {htIdx === 0 ? (
            <>
              <td rowSpan={4} className="px-3 py-2 align-top sticky left-0 bg-surface-950 z-10 border-t border-surface-700/30">
                <div className="font-medium text-surface-200">{row.employeeName}</div>
                <div className="text-xs text-surface-500 mt-0.5">{row.classification}</div>
                {row.worksite && <div className="text-xs text-surface-600">{row.worksite}</div>}
              </td>
              <td rowSpan={4} className="px-2 py-2 align-top text-xs text-surface-400 border-t border-surface-700/30">
                {row.projectNo}
              </td>
              <td rowSpan={4} className="px-2 py-2 align-top text-xs text-surface-400 border-t border-surface-700/30">
                {row.costCode}
              </td>
            </>
          ) : null}
          <td className="px-2 py-1">
            <span className={`text-xs font-medium ${getTypeTextColor(ht.key)}`}>{ht.label}</span>
          </td>
          {(row[ht.key] || [0, 0, 0, 0, 0, 0, 0]).map((val, dayIdx) => (
            <td key={dayIdx} className="px-0.5 py-0.5">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={val || ''}
                onChange={(e) => onCellChange(rowIdx, ht.key, dayIdx, parseFloat(e.target.value) || 0)}
                className="cell-input"
                placeholder="-"
              />
            </td>
          ))}
          <td className="text-center px-2 py-1 font-semibold text-surface-300 text-xs">
            {(row[ht.key] || []).reduce((s, v) => s + (v || 0), 0).toFixed(1)}
          </td>
          {htIdx === 0 ? (
            <td rowSpan={4} className="px-1 align-top pt-2 border-t border-surface-700/30">
              <button onClick={onDelete} className="text-surface-600 hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          ) : null}
        </tr>
      ))}
      {/* Daily totals row for this employee */}
      <tr className="border-b border-surface-700/30">
        <td colSpan={3} />
        <td className="px-2 py-1 text-xs font-bold text-surface-400">Daily Total</td>
        {DAYS_OF_WEEK.map((_, dayIdx) => {
          const dayTotal = HOUR_TYPES.reduce((sum, ht) => sum + ((row[ht.key] || [])[dayIdx] || 0), 0)
          return (
            <td key={dayIdx} className={`text-center text-xs font-bold py-1 ${dayTotal > 12 ? 'text-red-400' : dayTotal > 8 ? 'text-amber-400' : 'text-surface-300'}`}>
              {dayTotal > 0 ? dayTotal.toFixed(1) : '-'}
            </td>
          )
        })}
        <td className="text-center text-xs font-bold py-1 text-surface-100">
          {HOUR_TYPES.reduce((sum, ht) => sum + (row[ht.key] || []).reduce((s, v) => s + (v || 0), 0), 0).toFixed(1)}
        </td>
        <td />
      </tr>
    </>
  )
}

function getTypeTextColor(key) {
  const map = {
    contractHrs: 'text-blue-400',
    extraWorkHrs: 'text-amber-400',
    standbyHrs: 'text-violet-400',
    companyHrs: 'text-emerald-400',
  }
  return map[key] || 'text-surface-400'
}
