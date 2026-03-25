import { HOUR_TYPES, DAYS_OF_WEEK } from '../../lib/constants'

const TYPE_COLORS = {
  contractHrs: 'border-l-brand-600',
  extraWorkHrs: 'border-l-amber-500',
  standbyHrs: 'border-l-violet-500',
  companyHrs: 'border-l-emerald-500',
}

const TYPE_BG = {
  contractHrs: 'bg-brand-600/[0.03]',
  extraWorkHrs: 'bg-amber-500/[0.03]',
  standbyHrs: 'bg-violet-500/[0.03]',
  companyHrs: 'bg-emerald-500/[0.03]',
}

export default function TimesheetMatrix({ rows, weekDates, onCellChange, onDeleteRow }) {
  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-surface-800 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-surface-500 text-[13px]">No employees added yet</p>
          <p className="text-surface-600 text-[11px] mt-1">Click "+ Add Row" or import an Excel file</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="text-[10px] text-surface-500 uppercase tracking-wider">
            <th className="text-left px-3 py-2 w-44 sticky left-0 bg-surface-950 z-10">Employee</th>
            <th className="text-left px-2 py-2 w-16">Project</th>
            <th className="text-left px-2 py-2 w-16">Code</th>
            <th className="text-left px-2 py-2 w-20">Type</th>
            {DAYS_OF_WEEK.map((day) => (
              <th key={day} className="text-center px-1 py-2 w-14">{day}</th>
            ))}
            <th className="text-center px-2 py-2 w-14 font-bold text-surface-400">Total</th>
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
      {HOUR_TYPES.map((ht, htIdx) => {
        const rowTotal = (row[ht.key] || []).reduce((s, v) => s + (v || 0), 0)
        return (
          <tr
            key={ht.key}
            className={`${TYPE_BG[ht.key]} border-l-2 ${TYPE_COLORS[ht.key]} ${htIdx === 0 ? 'border-t border-surface-800' : ''}`}
          >
            {htIdx === 0 ? (
              <>
                <td rowSpan={4} className="px-3 py-2 align-top sticky left-0 bg-surface-950 z-10 border-t border-surface-800">
                  <div className="font-medium text-surface-200 text-[13px]">{row.employeeName}</div>
                  <div className="text-[11px] text-surface-600 mt-0.5">{row.classification}</div>
                  {row.worksite && <div className="text-[10px] text-surface-700">{row.worksite}</div>}
                </td>
                <td rowSpan={4} className="px-2 py-2 align-top text-[11px] text-surface-500 border-t border-surface-800">
                  {row.projectNo}
                </td>
                <td rowSpan={4} className="px-2 py-2 align-top text-[11px] text-surface-500 border-t border-surface-800">
                  {row.costCode}
                </td>
              </>
            ) : null}
            <td className="px-2 py-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${getTypeTextColor(ht.key)}`}>{ht.label}</span>
            </td>
            {(row[ht.key] || [0, 0, 0, 0, 0, 0, 0]).map((val, dayIdx) => {
              // Check if this cell contributes to overtime (daily total > 8)
              const dayTotal = HOUR_TYPES.reduce((sum, h) => sum + ((row[h.key] || [])[dayIdx] || 0), 0)
              const isOT = dayTotal > 8
              return (
                <td key={dayIdx} className="px-0.5 py-0.5 relative">
                  {isOT && htIdx === 0 && <div className="absolute top-0 left-0.5 right-0.5 h-[2px] bg-red-500/60 rounded-full" />}
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
              )
            })}
            <td className="text-center px-2 py-1 font-semibold text-surface-400 text-[12px] tabular-nums">
              {rowTotal > 0 ? rowTotal.toFixed(1) : '-'}
            </td>
            {htIdx === 0 ? (
              <td rowSpan={4} className="px-1 align-top pt-2.5 border-t border-surface-800">
                <button onClick={onDelete} className="text-surface-700 hover:text-red-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            ) : null}
          </tr>
        )
      })}
      {/* Daily totals row */}
      <tr className="border-b border-surface-800">
        <td colSpan={3} />
        <td className="px-2 py-1 text-[10px] font-bold text-surface-500 uppercase tracking-wider">Daily</td>
        {DAYS_OF_WEEK.map((_, dayIdx) => {
          const dayTotal = HOUR_TYPES.reduce((sum, ht) => sum + ((row[ht.key] || [])[dayIdx] || 0), 0)
          return (
            <td key={dayIdx} className={`text-center text-[11px] font-bold py-1 tabular-nums ${dayTotal > 12 ? 'text-red-400' : dayTotal > 8 ? 'text-amber-400' : 'text-surface-500'}`}>
              {dayTotal > 0 ? dayTotal.toFixed(1) : '-'}
            </td>
          )
        })}
        <td className="text-center text-[12px] font-bold py-1 text-surface-200 tabular-nums">
          {HOUR_TYPES.reduce((sum, ht) => sum + (row[ht.key] || []).reduce((s, v) => s + (v || 0), 0), 0).toFixed(1)}
        </td>
        <td />
      </tr>
    </>
  )
}

function getTypeTextColor(key) {
  const map = {
    contractHrs: 'text-brand-400',
    extraWorkHrs: 'text-amber-400',
    standbyHrs: 'text-violet-400',
    companyHrs: 'text-emerald-400',
  }
  return map[key] || 'text-surface-500'
}
