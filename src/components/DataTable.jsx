import { useState, useMemo } from 'react'

export default function DataTable({
  columns,
  data,
  pageSize = 25,
  onRowClick,
  emptyMessage = 'No data to display',
  compact = false,
}) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter) return data
    const lower = filter.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
        return String(val || '').toLowerCase().includes(lower)
      })
    )
  }, [data, filter, columns])

  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    const col = columns.find(c => c.id === sortCol || c.accessor === sortCol)
    if (!col) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor]
      const bVal = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [filtered, sortCol, sortDir, columns])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (colId) => {
    if (sortCol === colId) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(colId)
      setSortDir('asc')
    }
  }

  const cellPadding = compact ? 'px-3 py-1.5' : 'px-4 py-2.5'

  return (
    <div>
      {/* Filter */}
      {data.length > 5 && (
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(0) }}
            className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700/50">
              {columns.map((col) => (
                <th
                  key={col.id || col.accessor}
                  onClick={() => handleSort(col.id || col.accessor)}
                  className={`${cellPadding} text-left text-xs font-medium text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-200 select-none ${col.className || ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {sortCol === (col.id || col.accessor) && (
                      <span className="text-brand-400">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800/50">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-surface-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => {
                    const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
                    return (
                      <td key={col.id || col.accessor} className={`${cellPadding} text-surface-200 ${col.className || ''}`}>
                        {col.cell ? col.cell(val, row) : val}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800">
          <span className="text-xs text-surface-500">
            {sorted.length} results {filter && `(filtered from ${data.length})`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-xs text-surface-400 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
